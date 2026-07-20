'use client';
import type {ReactNode} from 'react'; import {getWorkspacePlugin} from './workspace-registry'; import {WorkspaceDockManager} from './WorkspaceDockManager';
export function WorkspaceHost({workspaceId,children}:{workspaceId:string;children?:ReactNode}){const plugin=getWorkspacePlugin(workspaceId);const Component=plugin.component;return <WorkspaceDockManager plugin={plugin}><Component plugin={plugin}>{children}</Component></WorkspaceDockManager>}
