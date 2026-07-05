import { MediaRuntime, NullMediaPlaybackAdapter, createMediaPlaybackCommand } from './index.js';
import type { MediaAsset, MediaClip, Playlist } from '../media-replay/types.js';

function assertEqual(actual: unknown, expected: unknown) { if (actual !== expected) throw new Error(`Expected ${String(expected)}, received ${String(actual)}`); }
function assertOk(value: unknown) { if (!value) throw new Error('Expected value to be truthy'); }
function assertThrows(fn: () => void) { let threw = false; try { fn(); } catch { threw = true; } if (!threw) throw new Error('Expected function to throw'); }

const asset: MediaAsset = { id: 'asset-1', name: 'Intro', type: 'video', durationMs: 10000, status: 'ready', programState: 'idle', previewState: 'idle', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
const clip: MediaClip = { id: 'clip-1', assetId: asset.id, name: 'Intro clip', inPointMs: 1000, outPointMs: 5000, durationMs: 4000, markers: [], loop: false, autoplay: false, volume: 1, playbackSpeed: 1, transitionInMs: 0, transitionOutMs: 0, programState: 'idle', previewState: 'idle', status: 'ready' };
const playlist: Playlist = { id: 'playlist-1', name: 'Show', currentIndex: 0, mode: 'sequential', status: 'ready', items: [{ id: 'item-1', assetId: asset.id, label: 'Intro' }, { id: 'item-2', clipId: clip.id, label: 'Clip' }] };

const runtime = new MediaRuntime({}, new NullMediaPlaybackAdapter());
runtime.dispatch(createMediaPlaybackCommand('LOAD_MEDIA', { asset, clip }));
assertEqual(runtime.state.currentMediaAsset?.id, 'asset-1');
assertEqual(runtime.state.currentClip?.id, 'clip-1');
assertEqual(runtime.state.durationMs, 4000);
runtime.dispatch(createMediaPlaybackCommand('PREPARE_MEDIA'));
assertEqual(runtime.state.playbackState, 'ready');
runtime.dispatch(createMediaPlaybackCommand('PLAY_MEDIA'));
assertEqual(runtime.state.playbackState, 'playing');
runtime.dispatch(createMediaPlaybackCommand('PAUSE_MEDIA'));
assertEqual(runtime.state.playbackState, 'paused');
runtime.dispatch(createMediaPlaybackCommand('STOP_MEDIA'));
assertEqual(runtime.state.playbackPositionMs, 0);
runtime.dispatch(createMediaPlaybackCommand('SEEK_MEDIA', { positionMs: 3000 }));
assertEqual(runtime.state.playbackPositionMs, 3000);
runtime.dispatch(createMediaPlaybackCommand('LOOP_MEDIA', { loop: true }));
assertEqual(runtime.state.loop, true);
runtime.dispatch(createMediaPlaybackCommand('SET_MEDIA_VOLUME', { volume: 0.5 }));
assertEqual(runtime.state.volume, 0.5);
runtime.dispatch(createMediaPlaybackCommand('SET_PLAYBACK_SPEED', { speed: 1.5 }));
assertEqual(runtime.state.speed, 1.5);
runtime.dispatch(createMediaPlaybackCommand('LOAD_PLAYLIST', { playlist }));
assertEqual(runtime.state.playlistRuntime.currentItem?.id, 'item-1');
runtime.dispatch(createMediaPlaybackCommand('PLAY_NEXT'));
assertEqual(runtime.state.playlistRuntime.currentItem?.id, 'item-2');
runtime.dispatch(createMediaPlaybackCommand('PLAY_PREVIOUS'));
assertEqual(runtime.state.playlistRuntime.currentItem?.id, 'item-1');
runtime.dispatch(createMediaPlaybackCommand('STAGE_MEDIA_PREVIEW', { asset }));
assertEqual(runtime.state.previewMedia?.id, 'asset-1');
runtime.dispatch(createMediaPlaybackCommand('TAKE_MEDIA_TO_PROGRAM'));
assertEqual(runtime.state.programMedia?.id, 'asset-1');
assertEqual(runtime.health.playbackRuntimeUnavailable, true);
assertEqual(runtime.health.mediaDecoded, false);
assertOk(runtime.state.events.find((e) => e.message === 'No player connected'));
assertOk(runtime.session.snapshot('validator'));
assertOk(runtime.state.history.length > 1);
runtime.dispatch(createMediaPlaybackCommand('CLEAR_MEDIA'));
assertEqual(runtime.state.currentMediaAsset, null);
assertEqual(runtime.metrics.queueSize, 0);

const invalid = new MediaRuntime({ durationMs: 100 });
invalid.dispatch(createMediaPlaybackCommand('SEEK_MEDIA', { positionMs: 200 }));
assertEqual(invalid.state.playbackState, 'failed');
invalid.dispatch(createMediaPlaybackCommand('SET_MEDIA_VOLUME', { volume: 2 }));
assertOk(invalid.metrics.droppedCommands >= 2);
assertThrows(() => new (Object.getPrototypeOf(invalid.session.executor).constructor)().execute(invalid.state, { ...createMediaPlaybackCommand('PLAY_MEDIA'), runtimeHandle: undefined }));
console.log('Runtime media validation passed');
