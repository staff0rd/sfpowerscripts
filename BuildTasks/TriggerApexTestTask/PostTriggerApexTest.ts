import tl = require("azure-pipelines-task-lib/task");
import path = require("path");
import fs = require("fs-extra");

async function run() {
  let stagingDir: string = path.join(
    tl.getVariable("build.artifactStagingDirectory"),
    ".testresults"
  );
  publishTestResults(stagingDir);
}

function publishTestResults(resultsDir: string): void {

  //Check if these files have been already read for publishing using a file as a flag
  const duplicateCheckFile = path.join(resultsDir, ".duplicateFile");

  if (!fs.existsSync(duplicateCheckFile)) {

    //Check if any files exist in the staging directory
    const matchingTestResultsFiles: string[] = tl.findMatch(
      resultsDir,
      "*-junit.xml"
    );

    

    if (matchingTestResultsFiles && matchingTestResultsFiles.length > 0) {


      tl.command(
        "artifact.upload",
        { artifactname: `Apex Test Results` },
        resultsDir
      );



      const buildConfig = tl.getVariable("BuildConfiguration");
      const buildPlaform = tl.getVariable("BuildPlatform");
      const testRunTitle = "Apex Test Run";

      const tp: tl.TestPublisher = new tl.TestPublisher("JUnit");
      tp.publish(
        matchingTestResultsFiles,
        "true",
        buildPlaform,
        buildConfig,
        testRunTitle,
        "true",
        "sfpowerscripts-apextests"
      );

      //Write a flag file causing other post jobs to skip
      fs.writeJSONSync(duplicateCheckFile, { testsPublished: true });
    }
  } else {
    console.log("Skipping Post Job as results are already publishedgi");
  }
}

run();
