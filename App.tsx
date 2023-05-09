import JitsiMeet, {JitsiCallbackModule} from 'react-native-jitsimeet';
import {NativeEventEmitter} from 'react-native';
import React, {useEffect} from 'react';
import {StyleSheet, View, Pressable, Text} from 'react-native';

const conferenceOptions = {
  room: `https://meet.jit.si/ReactNativeJitsiRoom${Math.random()}`,
  userInfo: {
    displayName: `ReactNativeJitsiRoom${Math.random()}`,
    email: 'example@test.com',
    avatar: 'https://picsum.photos/200',
  },
  featureFlags: {
    'live-streaming.enabled': false,
    'prejoinpage.enabled': false,
  },
  configOverrides: {
    'breakoutRooms.hideAddRoomButton': true,
  },
};

enum HTEventTypes {
  EXTEND_CHAT_RESPONSE = 'EXTEND_CHAT_RESPONSE',
  EXTEND_CHAT_REQUEST = 'EXTEND_CHAT_REQUEST',
  HELLO_TIGER_REQUEST = 'HELLO_TIGER_REQUEST',
  CONFERENCE_TERMINATED = 'CONFERENCE_TERMINATED',
}

const eventEmitter = new NativeEventEmitter(JitsiCallbackModule);

function App() {
  const [extendReq, setExtendReq] = React.useState(false);
  const [meetLoading, setMeetLoading] = React.useState(false);

  const startJitsiMeet = () => {
    setMeetLoading(true);
    registerEventEmitters();
    // This setTimeout needed only when user end the conference & start a new conference when the activity closing or when unRegistering native events or immediately after ending the conference. To avoid launch JitsiMeet at this, 2s delay is added for clean up. Remove this setTimeout when the conference starts not immediately (after 2s) after the conference is closed.
    setTimeout(() => {
      setMeetLoading(false);
      JitsiMeet.launchJitsiMeetView(conferenceOptions);
    }, 2000);
  };

  useEffect(() => {
    if (!extendReq) {
      return;
    }

    (async () => {
      try {
        const response = await fetch('https://api.publicapis.org/entries');
        if (response) {
          // sendEventToSDK params { event: string, status: boolean; data: any }
          JitsiMeet.sendEventToSDK(
            HTEventTypes.EXTEND_CHAT_RESPONSE,
            true,
            undefined,
          );
          setExtendReq(false);
        }
      } catch (error) {
        JitsiMeet.sendEventToSDK(
          HTEventTypes.EXTEND_CHAT_RESPONSE,
          false,
          undefined,
        );
        console.error(error);
      }
    })();
  }, [extendReq]);

  useEffect(() => {
    registerEventEmitters();

    return () => {
      unRegisterEventEmitters();
      setExtendReq(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const registerEventEmitters = () => {
    eventEmitter.addListener(HTEventTypes.HELLO_TIGER_REQUEST, data => {
      console.log('HELLO_TIGER_REQUEST');
      switch (data?.event) {
        case HTEventTypes.EXTEND_CHAT_REQUEST:
          console.log(`EXTEND_CHAT_REQUEST  => ${JSON.stringify(data)}`);
          setExtendReq(true);
      }
    });
    eventEmitter.addListener(HTEventTypes.CONFERENCE_TERMINATED, () => {
      unRegisterEventEmitters();
    });
  };

  const unRegisterEventEmitters = () => {
    eventEmitter.removeAllListeners(HTEventTypes.HELLO_TIGER_REQUEST);
    eventEmitter.removeAllListeners(HTEventTypes.CONFERENCE_TERMINATED);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={startJitsiMeet}
        style={({pressed}) => [styles.pressable, {opacity: pressed ? 0.5 : 1}]}>
        <Text style={styles.pressableText}>
          {meetLoading ? 'Loading ...' : 'Start Jitsi Meet'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressable: {
    width: '80%',
    borderRadius: 15,
    height: 50,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'blue',
  },
  pressableText: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
});

export default App;
