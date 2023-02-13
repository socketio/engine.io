import { Polling as XHR } from "./polling";
import { JSONP } from "./polling-jsonp";
import { WebSocket } from "./websocket";

export default {
  polling: polling,
  websocket: WebSocket,
};

/**
 * Polling polymorphic constructor.
 *
 * @api private
 */

function polling(req, downgradeOverlapStatus?: boolean) {
  if ("string" === typeof req._query.j) {
    return new JSONP(req, downgradeOverlapStatus);
  } else {
    return new XHR(req, downgradeOverlapStatus);
  }
}

polling.upgradesTo = ["websocket"];
