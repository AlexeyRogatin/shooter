import Entity from "../entities/entity";

export default class View<T extends Entity> {
  data: T;
  constructor(data: T) {
    this.data = data;
  }
}
