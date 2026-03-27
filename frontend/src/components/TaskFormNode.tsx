import type { Dispatch } from 'react';
import type { Skill } from '../types';

export interface TaskNode {
  id: string;
  title: string;
  skillIds: number[];
  subtasks: TaskNode[];
}

export type TaskAction =
  | { type: 'SET_TITLE'; path: number[]; value: string }
  | { type: 'SET_SKILLS'; path: number[]; skillIds: number[] }
  | { type: 'ADD_SUBTASK'; path: number[] }
  | { type: 'REMOVE_SUBTASK'; path: number[] };

function updateNode(root: TaskNode, path: number[], updater: (n: TaskNode) => TaskNode): TaskNode {
  if (path.length === 0) return updater(root);
  const [head, ...tail] = path;
  return {
    ...root,
    subtasks: root.subtasks.map((child, i) =>
      i === head ? updateNode(child, tail, updater) : child
    ),
  };
}

export function taskReducer(state: TaskNode, action: TaskAction): TaskNode {
  switch (action.type) {
    case 'SET_TITLE':
      return updateNode(state, action.path, n => ({ ...n, title: action.value }));
    case 'SET_SKILLS':
      return updateNode(state, action.path, n => ({ ...n, skillIds: action.skillIds }));
    case 'ADD_SUBTASK':
      return updateNode(state, action.path, n => ({
        ...n,
        subtasks: [
          ...n.subtasks,
          { id: crypto.randomUUID(), title: '', skillIds: [], subtasks: [] },
        ],
      }));
    case 'REMOVE_SUBTASK': {
      const parentPath = action.path.slice(0, -1);
      const idx = action.path[action.path.length - 1];
      return updateNode(state, parentPath, n => ({
        ...n,
        subtasks: n.subtasks.filter((_, i) => i !== idx),
      }));
    }
    default:
      return state;
  }
}

interface Props {
  node: TaskNode;
  path: number[];
  skills: Skill[];
  dispatch: Dispatch<TaskAction>;
  depth?: number;
}

export default function TaskFormNode({ node, path, skills, dispatch, depth = 0 }: Props) {
  const isRoot = path.length === 0;

  return (
    <div
      className={`${
        depth > 0
          ? 'ml-6 pl-4 border-l-2 border-indigo-500/40 mt-3'
          : ''
      }`}
    >
      <div className="bg-[#13151f] border border-[#2d3148] rounded-lg p-4">
        <div className="mb-3">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            {isRoot ? 'Task Title' : 'Subtask Title'}
          </label>
          <input
            type="text"
            value={node.title}
            onChange={e => dispatch({ type: 'SET_TITLE', path, value: e.target.value })}
            placeholder="Enter title..."
            className="w-full bg-[#0f1117] border border-[#2d3148] rounded-md px-3 py-2 text-[#e2e8f0] placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25 transition-colors"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Skills</label>
          <div className="flex flex-wrap gap-4">
            {skills.map(skill => (
              <label key={skill.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={node.skillIds.includes(skill.id)}
                  onChange={e => {
                    const newIds = e.target.checked
                      ? [...node.skillIds, skill.id]
                      : node.skillIds.filter(id => id !== skill.id);
                    dispatch({ type: 'SET_SKILLS', path, skillIds: newIds });
                  }}
                  className="accent-indigo-500 w-4 h-4"
                />
                <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">{skill.name}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1.5">Leave unchecked to auto-detect via AI</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => dispatch({ type: 'ADD_SUBTASK', path })}
            className="text-xs px-3 py-1.5 bg-[#1e2130] hover:bg-[#2d3148] text-slate-300 hover:text-slate-100 border border-[#2d3148] rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            + Add Subtask
          </button>
          {!isRoot && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'REMOVE_SUBTASK', path })}
              className="text-xs px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 hover:text-red-300 border border-red-900/40 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/40"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {node.subtasks.map((subtask, i) => (
        <TaskFormNode
          key={subtask.id}
          node={subtask}
          path={[...path, i]}
          skills={skills}
          dispatch={dispatch}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
