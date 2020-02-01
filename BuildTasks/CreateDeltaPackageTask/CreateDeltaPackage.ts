import tl = require("azure-pipelines-task-lib/task");
import { AppInsights } from "../Common/AppInsights";
import { isNullOrUndefined } from "util";
import CreateDeltaPackageImpl from "./CreateDeltaPackageImpl";
const path = require("path");
const fs = require("fs");

async function run() {
  try {
    const project = tl.getInput("package", false);
    const projectDirectory = tl.getInput("project_directory", false);
    const versionName: string = tl.getInput("version_name", false);
    const setBuildName: boolean = tl.getBoolInput("set_build_name",true);



    let revisionFrom: string = tl.getInput("revision_from", true);
    let revision_to: string = tl.getInput("revision_to", false);
    let options:any = {};

    options['bypass_directories']=tl.getInput("bypass_directories", false);
    options['only_diff_for']=tl.getInput("only_diff_for", false);
    


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

    if (setBuildName) {
      console.log(`Updating build number to ${versionName}`);
      tl.updateBuildNumber(versionName);
    }

    AppInsights.setupAppInsights(tl.getBoolInput("isTelemetryEnabled", true));

    let createDeltaPackageImp = new CreateDeltaPackageImpl(
      projectDirectory,
      project,
      revisionFrom,
      revision_to,
      generate_destructivemanifest,
      options
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
        version_name: versionName
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
