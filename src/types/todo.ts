export type Todo = {
  id: number;
  task_name: string;
  start_date: string;
  end_date: string;
  completed: number;
  created_at: string;
  completed_at: string | null;
  image_path: string | null;
};