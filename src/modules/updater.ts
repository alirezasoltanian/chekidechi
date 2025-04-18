import { updateYTDLP } from "@resync-tv/yt-dlp";
import { Cron } from "croner";
// import { YTDL_AUTOUPDATE } from "./environment"

export class Updater {
  public readonly enabled = process.env.YTDL_AUTOUPDATE === "true";
  public updating: Promise<void> | false = false;

  #job: Cron | null = null;

  constructor() {
    if (!this.enabled) return;

    this.#job = new Cron("20 4 * * *", this.update);
  }

  update = async () => {
    this.updating = this.#update();

    await this.updating;
    this.updating = false;
  };

  async #update() {
    try {
      const result = await updateYTDLP();
      console.log(result.stdout);
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    } finally {
      if (this.#job) {
        console.log("Next update scheduled at", this.#job.nextRun());
      }
    }
  }
}
