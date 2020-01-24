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
    const version_name: string = tl.getInput("version_name", false);
    let revision_from: string = tl.getInput("revision_from", true);
    const set_build_number: boolean = tl.getBoolInput("set_build_number",true);

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

    if (set_build_number) {
      console.log(`Updating build number to ${version_name}`);
      tl.updateBuildNumber(version_name);
    }

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
      tl.getVariable("build.repository.localpath"),
      "src_delta"
    );


    tl.setVariable("sfpowerscripts_delta_package_path", artifactFilePath);

    
    if (build_artifact_enabled) {
  

    tl.command(
      "artifact.upload",
      { artifactname: `sfpowerscripts_delta_package` },
      artifactFilePath
    );

 
      let repository_url = tl.getVariable("build.repository.uri");
      let commit_id = tl.getVariable("build.sourceVersion");

      let metadata = {
        sourceVersion: commit_id,
        repository_url: repository_url,
        package_type: "delta",
        version_name: version_name
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
