import { useEffect, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Skill } from '../types';
import { getSkills } from '../api/skills';
import { createTask } from '../api/tasks';
import type { TaskCreateInput } from '../api/tasks';
import GeminiWarningToast from '../components/GeminiWarningToast';
import TaskFormNode, { taskReducer } from '../components/TaskFormNode';
import type { TaskNode } from '../components/TaskFormNode';

function nodeToInput(node: TaskNode): TaskCreateInput {
  return {
    title: node.title,
    skillIds: node.skillIds.length > 0 ? node.skillIds : undefined,
    subtasks: node.subtasks.length > 0 ? node.subtasks.map(nodeToInput) : undefined,
  };
}

const initialState: TaskNode = {
  id: crypto.randomUUID(),
  title: '',
  skillIds: [],
  subtasks: [],
};

export default function CreateTaskPage() {
  const navigate = useNavigate();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [state, dispatch] = useReducer(taskReducer, initialState);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [geminiWarning, setGeminiWarning] = useState('');

  useEffect(() => {
    getSkills().then(setSkills);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.title.trim()) {
      setError('Task title is required');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const result = await createTask(nodeToInput(state));
      if (result.geminiWarning) {
        setGeminiWarning(result.geminiWarning);
        setTimeout(() => navigate('/'), 5000);
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    {geminiWarning && <GeminiWarningToast message={geminiWarning} onClose={() => navigate('/')} />}
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-[#e2e8f0] mb-6">Create Task</h1>
      <form onSubmit={handleSubmit}>
        <TaskFormNode
          node={state}
          path={[]}
          skills={skills}
          dispatch={dispatch}
          depth={0}
        />
        {error && (
          <p className="mt-4 text-red-400 text-sm bg-red-900/20 border border-red-900/40 rounded-md px-3 py-2">{error}</p>
        )}
        <div className="mt-6 flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-md font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-[#0f1117]"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Saving...
              </span>
            ) : 'Save Task'}
          </button>
        </div>
      </form>
    </div>
    </>
  );
}
