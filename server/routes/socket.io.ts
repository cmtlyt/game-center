function generateMetadata(peer: any, payload: any) {
  const { operation } = payload;
  const { customMetadata, sendSelfId } = operation || {};
  const result = {
    ...customMetadata,
  };

  if (sendSelfId) {
    result.from = peer.id;
  }

  return result;
}

function generatePayload(peer: any, event: string, payload: any) {
  return {
    event,
    userId: payload.userId,
    roomId: payload.roomId,
    data: payload.data,
    sign: payload.sign,
    metadata: generateMetadata(peer, payload),
  };
}

export default defineWebSocketHandler({
  open(peer) {
    peer.subscribe(peer.id);
  },
  message(peer, message) {
    const { event, payload } = message.json() as any;
    const { roomId, operation } = payload;
    const result = generatePayload(peer, event, payload);
    if (event === 'joinRoom') {
      peer.subscribe(roomId);
      peer.publish(roomId, result);
    }
    else if (event === 'leaveRoom') {
      peer.unsubscribe(roomId);
      peer.publish(roomId, result);
    }
    else if (event === 'broadcast') {
      const { onlySendTarget } = operation || {};
      if (onlySendTarget) {
        peer.publish(onlySendTarget, result);
        return;
      }
      else {
        peer.publish(roomId, result);
      }
    }
    peer.send(result);
  },
  close(peer) {
    peer.unsubscribe(peer.id);
  },
});
