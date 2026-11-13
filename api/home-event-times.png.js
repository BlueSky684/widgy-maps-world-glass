import calendar from './calendar-widget.js';
import {homeTimeImage} from '../lib/calendar-bridge/home-time-image.js';

// A separate image resource for Widgy: do not share its URL path with the
// JSON context endpoint. Keep the existing authorization and image adapter.
const image = homeTimeImage(calendar);
export default function handler(req, res) {
  res.setHeader('X-Home-Time-Endpoint', 'png-v1');
  return image(req, res);
}
