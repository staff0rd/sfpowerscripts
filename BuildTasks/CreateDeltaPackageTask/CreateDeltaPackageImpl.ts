import child_process = require("child_process");
import { onExit } from "../Common/OnExit";
import { isNullOrUndefined } from "util";

export default class CreateDeltaPackageImpl {
  public constructor(
    private project_directory: string,
    private project: string,
    private revision_from: string,
    private revision_to: string,
    private generate_destructivemanifest: boolean
  ) {}

  public async exec(command: string): Promise<void> {
    let child = child_process.exec(
      command,
      { encoding: "utf8", cwd: this.project_directory },
      (error, stdout, stderr) => {
        if (error) throw error;
      }
    );

    child.stdout.on("data", data => {
      console.log(data.toString());
    });
    child.stderr.on("data", data => {
      console.log(data.toString());
    });

    await onExit(child);
  }

  public async buildExecCommand(): Promise<string> {
    let command;
    command = `npx sfdx sfpowerkit:project:diff`;

    if (!isNullOrUndefined(this.revision_to))
      command += ` -t  ${this.revision_to}`;

    if (!isNullOrUndefined(this.revision_from))
      command += ` -r  ${this.revision_from}`;

    if (this.generate_destructivemanifest) command += ` -x`;

    command += ` -d  src_delta`;

    return command;
  }
}
