import tl = require("azure-pipelines-task-lib/task");
import child_process = require("child_process");
import TriggerApexTestImpl from "./TriggerApexTestImpl";
import { AppInsights } from "../Common/AppInsights";
import path = require("path");
import os = require("os");

async function run() {
  let test_options = {};

  try {
    
    AppInsights.setupAppInsights(tl.getBoolInput("isTelemetryEnabled",true));
    const target_org: string = tl.getInput("target_org", true);
  
    test_options["wait_time"] = tl.getInput("wait_time", true);

    test_options["testlevel"] = tl.getInput("testlevel", true);
    test_options["synchronous"] = tl.getBoolInput("synchronous", false);



    if (test_options["testlevel"] == "RunSpecifiedTests")
    test_options["specified_tests"] = tl.getInput("specified_tests", true);
    if (test_options["testlevel"] == "RunApexTestSuite")
    test_options["apextestsuite"] = tl.getInput("apextestsuite", true);
   

    let stagingDir: string = path.join(
      tl.getVariable("build.artifactStagingDirectory"),
      ".testresults"
    );

    test_options['outputdir']=stagingDir;


    let triggerApexTestImpl:TriggerApexTestImpl = new TriggerApexTestImpl(target_org,test_options);
    console.log("Executing command");
    await triggerApexTestImpl.exec();

  

    AppInsights.trackTask("sfpwowerscript-triggerapextest-task");
    AppInsights.trackTaskEvent("sfpwowerscript-triggerapextest-task","apex_test_triggered");    

  } catch (err) {
    AppInsights.trackExcepiton("sfpwowerscript-triggerapextest-task",err);    
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}
run();
