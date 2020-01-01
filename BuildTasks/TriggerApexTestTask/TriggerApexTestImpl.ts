import child_process = require("child_process");
import { onExit } from "../Common/OnExit";

export default class TriggerApexTestImpl {
  public constructor(private target_org: string, private test_options: any) {}

  public async exec(): Promise<void> {
    
    //Print Test in Human Reable Format and also store it in staging directory
    let child = child_process.exec(
      this.buildExecCommand(),
      { encoding: "utf8" },
      (error, stdout, stderr) => {
        if (error) throw error;
      }
    );

    child.stdout.on("data", data => {
      console.log(data.toString());
    });

    await onExit(child);
  }

  private buildExecCommand(): string {
    let command = `npx sfdx force:apex:test:run -u ${this.target_org}`;

    if (this.test_options["synchronous"] == true) command += ` -y`;

    command += ` -c`;

    command += ` -r human`;
    //wait time
    command += ` -w  ${this.test_options["wait_time"]}`;

    //store result
    command += ` -d  ${this.test_options["outputdir"]}`;

    //testlevel
    command += ` -l ${this.test_options["testlevel"]}`;

    if (this.test_options["testlevel"] == "RunSpecifiedTests") {
      command += ` -t ${this.test_options["specified_tests"]}`;
    } else if (this.test_options["testlevel"] == "RunApexTestSuite") {
      command += ` -s ${this.test_options["apextestsuite"]}`;
    }
    console.log(`Generated Command: ${command}`);
    return command;
  }


}
