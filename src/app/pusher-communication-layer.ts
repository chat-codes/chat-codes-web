import {CREDENTIALS} from './pusher-credentials';
import * as Pusher from 'pusher-js';
import * as _ from 'underscore';
import {format} from 'url';
const SIZE_THRESHOLD = 5;
const EMIT_RATE = 100;

function guid(): string {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function getAuthURL(userName) {
  return format({
    hostname: 'chat.codes',
    protocol: 'http',
    pathname: 'auth.php',
    query: { name: userName }
  });
}
function chunkString(str: string, maxChunkSize: number): Array<string> {
  return str.match(new RegExp('.{1,' + maxChunkSize + '}', 'g'));
}

export class PusherCommunicationLayer {
  constructor(authInfo) {
    this.pusher = new Pusher(CREDENTIALS.key, {
    		cluster: CREDENTIALS.cluster,
    		encrypted: true,
    		authEndpoint: getAuthURL(authInfo.username)
    });
  }
  private pusher: Pusher;
  private messageQueue: Array<any> = [];
  private channels: { [channelName: string]: any } = {}
  private getChannelSubscriptionPromise(channelName): Promise<any> {
    return new Promise((resolve, reject) => {
      let channel = this.pusher.subscribe(channelName);
      if (channel.subscribed) {
        resolve(channel);
      } else {
        channel.bind('pusher:subscription_succeeded', () => {
          resolve(channel);
        });
        channel.bind('pusher:subscription_error', (err) => {
          reject(err);
        });
      }
    });
  }
  public onMemberAdded(channelName, callback) {
    const {presencePromise} = this.getChannel(channelName);
    presencePromise.then(function(channel) {
      channel.bind('pusher:member_added', callback);
    });
  }
  public onMemberRemoved(channelName, callback) {
    const {presencePromise} = this.getChannel(channelName);
    presencePromise.then(function(channel) {
      channel.bind('pusher:member_removed', callback);
    });
  }
  public channelReady(channelName) {
    const {privatePromise, presencePromise} = this.getChannel(channelName);
    return Promise.all([privatePromise, presencePromise]);
  }
  public trigger(channelName, eventName, eventContents) {
    const {privatePromise} = this.getChannel(channelName);
    privatePromise.then(function(channel) {
      this.pushToMessageQueue(channelName, eventName, eventContents);
    });
  }
  private emitTimeout: any = false;
  private shiftMessageFromQueue() {
    if (this.messageQueue.length > 0) {
      const {channelName, eventName, payload} = this.messageQueue.shift();
      this.emitTimeout = window.setTimeout(() => {
        this.emitTimeout = false;
        this.shiftMessageFromQueue();
      }, EMIT_RATE);

      if (!this.emitTimeout) {

      }
    } else {
      this.emitTimeout = false;
    }

    if (!this.emitTimeout) {

    }
  }
  private pushToMessageQueue(channelName, eventName, eventContents) {
    const id = guid();
    const stringifiedContents = JSON.stringify(eventContents);
    const stringChunks = chunkString(stringifiedContents, SIZE_THRESHOLD);
    const messageChunks = _.map(stringChunks, (s, i) => {
      return {
        channelName: channelName,
        eventName: eventName,
        payload: {
          s: s,
          i: i,
          n: stringChunks.length,
          m: id
        }
      };
    });
    this.messageQueue.push.apply(this.messageQueue, messageChunks);
    this.shiftMessageFromQueue();
  }
  public bind(channelName, eventName, callback) {
    const {privatePromise} = this.getChannel(channelName);
    privatePromise.then((channel) => {
      channel.bind('client-' + eventName, (packagedData) => {
        const {payload} = packagedData;
        const data = JSON.parse(payload);
        callback(data);
      });
    });
  }
  public getMembers(channelName) {
    const {presencePromise} = this.getChannel(channelName);
    return presencePromise.then(function(channel) {
      return channel.members;
    });
  }
  public channelNameAvailable(name) {
    var presenceChannel = this.pusher.subscribe('presence-' + name);
    return this.getChannelSubscriptionPromise('presence-' + name).then(function(channel) {
      const members = channel.members;
      var myID = members.myID;
      var anyOtherPeople = _.some(members.members, (memberInfo, id) => {
        return id !== myID;
      });
      // channel.disconnect();
      return (!anyOtherPeople);
    });
  }
  private getChannel(channelName) {
    if (!this.isSubscribed(channelName)) {
      this.doSubscribe(channelName);
    }
    return this.channels[channelName];
  }
  private isSubscribed(channelName) {
    return _.has(this.channels, channelName);
  }
  private doSubscribe(channelName) {
    this.channels[channelName] = {
      privatePromise: this.getChannelSubscriptionPromise('private-' + channelName),
      presencePromise: this.getChannelSubscriptionPromise('presence-' + channelName)
    };
  }
  private doUnsubscribe(channelName) {
    // this.channels[channelName].private.unsubscribe();
    // this.channels[channelName].presence.unsubscribe();
    this.pusher.unsubscribe('private-' + channelName);
    this.pusher.unsubscribe('presence-' + channelName);
    delete this.channels[channelName];
  }
  public destroy() {
    this.pusher.disconnect();
  }
}
