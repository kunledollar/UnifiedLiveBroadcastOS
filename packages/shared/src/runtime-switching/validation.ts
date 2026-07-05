function assertEqual(actual: unknown, expected: unknown) { if (actual !== expected) throw new Error(`Expected ${String(expected)}, received ${String(actual)}`); }
function assertOk(value: unknown) { if (!value) throw new Error('Expected value to be truthy'); }
import { AutoCommand, CutCommand, PreviewCommand, ProductionRuntime, RedoCommand, TransitionCommand, UndoCommand } from './index.js';

const runtime = new ProductionRuntime({ currentProgram: 'scene-a', currentPreview: 'scene-b', currentScene: 'scene-a' });
runtime.dispatch(CutCommand('director'));
assertEqual(runtime.state.currentProgram, 'scene-b');
assertEqual(runtime.session.history.history.length, 2);
runtime.dispatch(PreviewCommand('scene-c', 'director'));
assertEqual(runtime.state.currentPreview, 'scene-c');
runtime.dispatch(TransitionCommand('AUTO', 750, 'director'));
runtime.dispatch(AutoCommand('director'));
assertEqual(runtime.state.currentProgram, 'scene-c');
assertEqual(runtime.state.transitionProgress, 1);
runtime.dispatch(UndoCommand('director'));
assertEqual(runtime.state.currentProgram, 'scene-b');
runtime.dispatch(UndoCommand('director'));
assertEqual(runtime.state.currentPreview, 'scene-c');
runtime.dispatch(RedoCommand('director'));
assertEqual(runtime.state.currentTransition, 'AUTO');
const beforeDrops = runtime.health.droppedCommands;
runtime.dispatch(AutoCommand('director'));
runtime.dispatch(AutoCommand('director'));
assertEqual(runtime.health.droppedCommands, beforeDrops + 1);
assertOk(runtime.recovery.RestoreLastSnapshot());
assertEqual(runtime.health.runtimeAlive, true);
console.log('Runtime switching validation passed');
