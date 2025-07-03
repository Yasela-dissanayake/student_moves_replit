declare module 'simple-peer' {
  interface SimplePeerData {
    sdp: string;
    type: string;
  }

  interface SimplePeerOptions {
    initiator?: boolean;
    channelConfig?: object;
    channelName?: string;
    config?: object;
    offerOptions?: object;
    answerOptions?: object;
    reconnectTimer?: number;
    sdpTransform?: (sdp: string) => string;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    wrtc?: object;
    objectMode?: boolean;
  }

  class SimplePeer {
    constructor(opts?: SimplePeerOptions);
    
    signal(data: string | SimplePeerData): void;
    on(event: string, callback: (...args: any[]) => any): void;
    destroy(err?: Error): void;
    send(data: string | Uint8Array | ArrayBuffer | Blob): void;
    addStream(stream: MediaStream): void;
    removeStream(stream: MediaStream): void;
    addTrack(track: MediaStreamTrack, stream: MediaStream): void;
    removeTrack(track: MediaStreamTrack, stream: MediaStream): void;
    replaceTrack(oldTrack: MediaStreamTrack, newTrack: MediaStreamTrack, stream: MediaStream): void;
    
    readonly readable: boolean;
    readonly writable: boolean;
    readonly destroyed: boolean;
    readonly connected: boolean;
  }

  export default SimplePeer;
}