
export type TaskState = {
  label: string;
  color: string;
  state: number;
}

export type OriginTask = {
  uuid: string;
  state: string;
  user: string;
  task: {
    cloud_vendor: string;
    valume_type: string;
    base_image: string;
  }
}

export type SubstrateImage = {
  label: string;
  image: string;
}

export type Task = {
  uuid: string;
  user: string;
  state: TaskState;
  image: SubstrateImage;
}