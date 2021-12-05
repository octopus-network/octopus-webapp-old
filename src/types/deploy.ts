
export type TaskState = {
  label: string;
  color: string;
  state: number;
}

export type OriginTask = {
  uuid: string;
  state: string;
  user: string;
  instance: {
    user: string;
    ip: string;
    ssh_key: string;
  };
  task: {
    cloud_vendor: string;
    valume_type: string;
    base_image: string;
  }
}

export type DeployInstance = {
  user: string;
  ip: string;
  sshKey: string;
}

export type SubstrateImage = {
  label: string;
  chain?: string;
  image: string;
}

export type Task = {
  uuid: string;
  user: string;
  instance: DeployInstance;
  state: TaskState;
  image: SubstrateImage;
}