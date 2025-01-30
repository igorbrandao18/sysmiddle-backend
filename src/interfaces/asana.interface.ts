export interface AsanaProject {
  data: {
    gid: string;
    name: string;
    resource_type: string;
  };
}

export interface AsanaSection {
  data: {
    gid: string;
    name: string;
    resource_type: string;
  };
}

export interface AsanaTask {
  data: {
    gid: string;
    name: string;
    notes?: string;
    due_on?: string;
    resource_type: string;
  };
}

export interface CreateTaskParams {
  name: string;
  notes?: string;
  due_on?: string;
  projects: string[];
  section?: string;
} 