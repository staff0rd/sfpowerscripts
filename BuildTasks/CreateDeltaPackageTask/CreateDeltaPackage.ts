import tl = require("azure-pipelines-task-lib/task");
import { AppInsights } from "../Common/AppInsights";
import { isNullOrUndefined } from "util";
import CreateDeltaPackageImpl from "./CreateDeltaPackageImpl";
const path = require("path");
const fs = require("fs");

async function run() {
  try {
    const project = tl.getInput("package", false);
    const project_directory = tl.getInput("project_directory", false);
    const version_number: string = tl.getInput("version_number", false);
    let revision_from: string = tl.getInput("revision_from", true);

    let revision_to: string = tl.getInput("revision_to", false);
    if (isNullOrUndefined(revision_to)) {
      revision_to = tl.getVariable("build.sourceVersion");
    }
    const generate_destructivemanifest = tl.getBoolInput(
      "generate_destructivemanifest",
      false
    );
    const build_artifact_enabled = tl.getBoolInput(
      "build_artifact_enabled",
      true
    );

    AppInsights.setupAppInsights(tl.getBoolInput("isTelemetryEnabled", true));

    let createDeltaPackageImp = new CreateDeltaPackageImpl(
      project_directory,
      project,
      revision_from,
      revision_to,
      generate_destructivemanifest
    );
    let command = await createDeltaPackageImp.buildExecCommand();

    tl.debug(`Command Generated ${command}`);
    await createDeltaPackageImp.exec(command);

    let artifactFilePath = path.join(
     __dirname,
      "src_delta"
    );

    tl.command(
      "artifact.upload",
      { artifactname: `Package` },
      artifactFilePath
    );

    if (build_artifact_enabled) {
      let repository_url = tl.getVariable("build.repository.uri");
      let commit_id = tl.getVariable("build.sourceVersion");

      let metadata = {
        sourceVersion: commit_id,
        repository_url: repository_url,
        package_type: "delta"
      };

      fs.writeFileSync(
        __dirname + "/artifact_metadata",
        JSON.stringify(metadata)
      );

      let data = {
        artifacttype: "container",
        artifactname: "sfpowerkit_artifact"
      };

      // upload or copy
      data["containerfolder"] = "sfpowerkit_artifact";

      // add localpath to ##vso command's properties for back compat of old Xplat agent
      data["localpath"] = __dirname + "/artifact_metadata";
      tl.command("artifact.upload", data, __dirname + "/artifact_metadata");
    }
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
