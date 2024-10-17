import EventEmitter from "node:events";
export interface ReqEventParams {
  resourceUrl: string;
  method: string;
  time: Date;
  ip: string;
}

type Reqs = Record<string, Partial<ReqEventParams>[]>;
export default class ReqEvent extends EventEmitter {
  public resourceUrl: string | undefined;
  public method: string | undefined;
  public time: Date | undefined;
  public ip: string | undefined;

  private reqs: Reqs = {};
  receiveReq(params: ReqEventParams) {
    this.resourceUrl = params.resourceUrl;
    this.method = params.method;
    this.time = params.time;
    this.ip = params.ip;

    if (this.reqs[params.resourceUrl]) {
      this.reqs[params.resourceUrl].push({
        ip: params.ip,
        method: params.method,
        time: params.time
      });
    } else {
      this.reqs[params.resourceUrl] = [
        {
          ip: params.ip,
          method: params.method,
          time: params.time,
          resourceUrl: params.resourceUrl
        }
      ];
    }
  }

  getReqsByUrl(url: string) {
    let rsrcReqs;
    for (const [rsrcUrl, reqs] of Object.entries(this.reqs)) {
      if (rsrcUrl === url) {
        rsrcReqs = reqs;
        break;
      }
    }

    return rsrcReqs;
  }
}

const reqEvent = new ReqEvent();
export { reqEvent };
