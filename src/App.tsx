// @ts-nocheck

import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { Canvas, useFrame } from 'react-three-fiber';
// @ts-ignore
import { Search, SpotifyApiContext, TrackAnalysis } from 'react-spotify-api';
// @ts-ignore
import { SpotifyAuth } from 'react-spotify-auth';
import Cookies from 'js-cookie';
import SpotifyPlayer from 'react-spotify-web-playback';

import Metronome from './metronome/metronome';

function Box(props: any) {
  const { isPlaying, rotationSpeed } = props;

  // This reference will give us direct access to the mesh
  const mesh = useRef();

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  // Rotate mesh every frame, this is outside of React without overhead
  useFrame(() => {
    if (isPlaying) {
      // @ts-ignore
      mesh.current.rotation.x += rotationSpeed;
      // @ts-ignore
      mesh.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <mesh
      {...props}
      ref={mesh}
      scale={active ? [2.5, 2.5, 2.5] : [2, 2, 2]}
      onClick={() => setActive(!active)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      castShadow
    >
      <camera position={[0, 0, 15]} />
      <boxGeometry />
      <meshBasicMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

function SpotifyApp({
  play,
  setIsPlaying,
  setPlay,
  setTempo,
  token,
}: {
  isPlaying: boolean;
  play: boolean;
  setIsPlaying: any;
  setPlay: any;
  setTempo: any;
  token: string;
}) {
  const [activeTrackId, setActiveTrackId] = useState('');
  const [uris, setUris] = useState<Array<any>>([]);

  return (
    <>
      <SpotifyPlayer
        callback={(state) => {
          setIsPlaying(state.isPlaying);
        }}
        play={play}
        showSaveIcon
        token={token}
        uris={uris}
      />

      <Search query='lost on you' track>
        {({ data }: any) => {
          return data ? (
            <ul>
              <li>Tracks</li>
              <ul>
                {data.tracks.items.map((track: any) => (
                  <li
                    onClick={() => {
                      setActiveTrackId(track.id);
                      setUris([track.uri]);
                      setPlay(true);
                    }}
                    key={track.id}
                  >
                    {track.name}
                  </li>
                ))}
              </ul>
            </ul>
          ) : null;
        }}
      </Search>

      <TrackAnalysis id={activeTrackId}>
        {(analysis: any) => {
          if (analysis.data?.track.tempo) {
            setTempo(analysis.data?.track.tempo);
          }

          return analysis ? (
            <h1>
              Análise{' '}
              <ul>
                <li>Tempo: {analysis.data?.track.tempo}</li>
              </ul>
            </h1>
          ) : null;
        }}
      </TrackAnalysis>
    </>
  );
}

function App() {
  const token = Cookies.get('spotifyAuthToken');
  const [isPlaying, setIsPlaying] = useState(false);
  const [play, setPlay] = useState(false);
  const [tempo, setTempo] = useState(0);
  const [rotationSpeed, setRotationSpeed] = useState(0);

  useEffect(() => {
    if (window.location.pathname === '/callback') {
      window.location.replace('/');
    }
  }, []);

  useEffect(() => {
    if (!play) {
      setRotationSpeed(0);
    } else {
      setRotationSpeed((tempo / 60) * 0.01);
    }
  }, [play, tempo]);

  return (
    <SpotifyApiContext.Provider value={token}>
      <div className='app'>
        <Metronome
          tempo={168.225}
          render={({ tempo, beatsPerMeasure, playing, beat, subdivision, onPlay, onBpmChange }) => (
            <div>
              <h1>
                <small>{tempo} BPM</small> <br />
                <span style={{ color: isPlaying && beat === 1 ? 'red' : '' }}>1</span>
                <span style={{ color: isPlaying && beat === 2 ? 'red' : '' }}>2</span>
                <span style={{ color: isPlaying && beat === 3 ? 'red' : '' }}>3</span>
                <span style={{ color: isPlaying && beat === 4 ? 'red' : '' }}>4</span>
                <button onClick={onPlay}>{playing ? 'Pause' : 'Play'}</button>
              </h1>
            </div>
            // <div>
            //   <header>

            //     {beatsPerMeasure}/{beatsPerMeasure} <small>T.S.</small>
            //   </header>

            //   <main>
            //     <input
            //       type='range'
            //       min={40}
            //       max={240}
            //       value={tempo}
            //       onChange={(event) => onBpmChange && onBpmChange(event.target.value)}
            //     />
            //     {beat}/{beatsPerMeasure}
            //   </main>
            // </div>
          )}
        />

        <button
          onClick={() => {
            if (rotationSpeed > 0) {
              setRotationSpeed(rotationSpeed - 0.01);
            }
          }}
        >
          decrease
        </button>

        <button
          onClick={() => {
            setRotationSpeed(rotationSpeed + 0.01);
          }}
        >
          increase
        </button>

        <Canvas>
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
          <pointLight position={[-10, -10, -10]} />

          <Box isPlaying={isPlaying} position={[0, 0, 0]} rotationSpeed={rotationSpeed} tempo={tempo} />
        </Canvas>
      </div>

      <SpotifyApp
        isPlaying={isPlaying}
        play={play}
        setIsPlaying={setIsPlaying}
        setPlay={setPlay}
        setTempo={setTempo}
        token={token ?? ''}
      />

      {!token && (
        <SpotifyAuth
          redirectUri='http://localhost:3000/callback'
          clientID='f55ecbc5d4a943fc80e813aae904bd0b'
          scopes={[
            'streaming',
            'user-read-email',
            'user-read-private',
            'user-read-playback-state',
            'user-modify-playback-state',
            'user-library-read',
            'user-library-modify',
          ]}
        />
      )}
    </SpotifyApiContext.Provider>
  );
}

export default App;
