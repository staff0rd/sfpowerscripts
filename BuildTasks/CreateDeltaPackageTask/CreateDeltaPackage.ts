import tl = require("azure-pipelines-task-lib/task");
import { AppInsights } from "../Common/AppInsights";
import { isNullOrUndefined } from "util";
import CreateDeltaPackageImpl from "./CreateDeltaPackageImpl";
const path = require("path");

async function run()
{
    try
    {
    const project = tl.getInput("package", false);
    const project_directory = tl.getInput("project_directory", false);
    const version_number: string = tl.getInput("version_number", false);
    let revision_from: string = tl.getInput("revision_from", true);

    let revision_to: string = tl.getInput("revision_to", false);
    if(isNullOrUndefined(revision_to))
    {
        revision_to = tl.getVariable("build.sourceVersion");
    }
    const generate_destructivemanifest=tl.getBoolInput("generate_destructivemanifest", false);
    AppInsights.setupAppInsights(tl.getBoolInput("isTelemetryEnabled", true));
    

    let createDeltaPackageImp = new CreateDeltaPackageImpl(project_directory,project,revision_from,revision_to,generate_destructivemanifest);
    let command = await createDeltaPackageImp.buildExecCommand();

    tl.debug(`Command Generated ${command}`);
    await createDeltaPackageImp.exec(command);


    let artifactFilePath = path.join(
        tl.getVariable("build.repository.localpath"),
        "src_delta"
      );

    tl.command(
        "artifact.upload",
        { artifactname: `Diff Artifact` },
        artifactFilePath
      )
    }
    catch(err)
    {
        tl.setResult(tl.TaskResult.Failed, err.message);
    }


}