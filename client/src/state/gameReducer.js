import initialState from './initialState';

let toastId = 0;
let evtId   = 0;

function mkEvt(type, message, extra = {}) {
  return { id: `e${++evtId}`, type, message, timestamp: Date.now(), ...extra };
}

function addEvent(state, evt) {
  const feed = [evt, ...state.eventFeed].slice(0, 40);
  return { ...state, eventFeed: feed };
}

export default function gameReducer(state, action) {
  switch (action.type) {

    case 'SOCKET_CONNECTED':   return { ...state, connected: true, socketId: action.payload.socketId };
    case 'SOCKET_DISCONNECTED':return { ...state, connected: false };
        
    
    
    default: return state;
  }
}
