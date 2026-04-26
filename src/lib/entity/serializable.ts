const metadataMap = new WeakMap<
  object,
  {
    serialize: Set<string>;
    id?: string;
    tempId?: string;
    arrayOf?: Map<string, new () => any>;
  }
>();

function getMetadata(ctor: any) {
  if (!ctor) return { serialize: new Set<string>() };
  let meta = metadataMap.get(ctor);
  if (!meta) {
    meta = { serialize: new Set<string>() };
    metadataMap.set(ctor, meta);
  }
  return meta;
}

function collectWhitelist(ctor: any): Set<string> {
  const whitelist = new Set<string>();
  let current = ctor;
  while (current && current !== Object.prototype) {
    const meta = metadataMap.get(current);
    if (meta?.serialize) {
      meta.serialize.forEach((name) => whitelist.add(name));
    }
    current = Object.getPrototypeOf(current);
  }
  return whitelist;
}

function getIdProperty(ctor: any): string | undefined {
  let current = ctor;
  while (current && current !== Object.prototype) {
    const meta = metadataMap.get(current);
    if (meta?.id) return meta.id;
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

function getTempIdProperty(ctor: any): string | undefined {
  let current = ctor;
  while (current && current !== Object.prototype) {
    const meta = metadataMap.get(current);
    if (meta?.tempId) return meta.tempId;
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

function getArrayOf(ctor: any, prop: string): (new () => any) | undefined {
  let current = ctor;
  while (current && current !== Object.prototype) {
    const meta = metadataMap.get(current);
    if (meta?.arrayOf?.has(prop)) return meta.arrayOf.get(prop);
    current = Object.getPrototypeOf(current);
  }
  return undefined;
}

export function Serialize(
  original: any,
  context: ClassFieldDecoratorContext | ClassGetterDecoratorContext,
) {
  const { name, addInitializer } = context;
  addInitializer(function (this: any) {
    getMetadata(this.constructor).serialize.add(name as string);
  });
  return original;
}

export function Id(
  original: any,
  context: ClassFieldDecoratorContext | ClassGetterDecoratorContext,
) {
  const { name, addInitializer } = context;
  addInitializer(function (this: any) {
    const meta = getMetadata(this.constructor);
    meta.id = name as string;
    meta.serialize.add(name as string);
  });
  return original;
}

export function TempId(original: any, context: ClassFieldDecoratorContext) {
  const { name, addInitializer } = context;
  addInitializer(function (this: any) {
    const meta = getMetadata(this.constructor);
    meta.tempId = name as string;
    meta.serialize.add(name as string);
  });
  return original;
}

export function ArrayOf<T>(elementConstructor: new () => T) {
  return function (
    original: any,
    context: ClassFieldDecoratorContext | ClassGetterDecoratorContext,
  ) {
    const { name, addInitializer } = context;
    addInitializer(function (this: any) {
      const meta = getMetadata(this.constructor);
      if (!meta.arrayOf) meta.arrayOf = new Map();
      meta.arrayOf.set(name as string, elementConstructor);
      meta.serialize.add(name as string);
    });
    return original;
  };
}

export function Serializable<T extends { new (...args: any[]): {} }>(
  constructor: T,
) {
  return class extends constructor {
    toJSON() {
      const whitelist = collectWhitelist(this.constructor);
      const result: any = {};
      for (const prop of whitelist) {
        result[prop] = (this as any)[prop];
      }
      return result;
    }
  };
}

function inferElementCtor(
  target: any[],
  data: any[],
  explicitCtor?: new () => any,
): new () => any {
  if (explicitCtor) return explicitCtor;
  if (target.length > 0) return target[0].constructor;
  if (data.length > 0 && data[0] && typeof data[0] === "object") {
    const proto = Object.getPrototypeOf(data[0]);
    if (proto && proto.constructor !== Object) return proto.constructor;
  }
  return Object;
}

function deserializeInternal(
  target: any,
  data: any,
  seen: WeakMap<any, any>,
  elementCtor?: new () => any,
): any {
  if (data === null || typeof data !== "object") return data;
  if (seen.has(data)) return seen.get(data);

  if (Array.isArray(data)) {
    if (!Array.isArray(target)) target = [];
    const finalCtor = inferElementCtor(target, data, elementCtor);
    const idProp = getIdProperty(finalCtor);
    const tempIdProp = getTempIdProperty(finalCtor);

    if (idProp || tempIdProp) {
      const existingById = new Map<any, any>();
      const existingByTemp = new Map<any, any>();
      for (const item of target) {
        const idValue = idProp ? item[idProp] : undefined;
        if (idValue !== undefined && idValue !== null) {
          existingById.set(idValue, item);
        }
        if (tempIdProp) {
          const tempValue = item[tempIdProp];
          if (tempValue !== undefined && tempValue !== null) {
            existingByTemp.set(tempValue, item);
          }
        }
      }

      const newArray: any[] = [];
      for (const itemData of data) {
        const incomingId = idProp ? itemData[idProp] : undefined;
        const incomingTemp = tempIdProp ? itemData[tempIdProp] : undefined;
        let existing: any = undefined;
        if (incomingTemp !== undefined) {
          existing = existingByTemp.get(incomingTemp);
        }
        if (!existing && incomingId !== undefined) {
          existing = existingById.get(incomingId);
        }
        if (!existing) {
          existing = new finalCtor();
          if (incomingId !== undefined && idProp) {
            existing[idProp] = incomingId;
          }
          if (incomingTemp !== undefined && tempIdProp) {
            existing[tempIdProp] = incomingTemp;
          }
          target.push(existing);
        } else {
          if (
            incomingId !== undefined &&
            idProp &&
            existing[idProp] !== incomingId
          ) {
            existing[idProp] = incomingId;
          }
          if (tempIdProp && existing[tempIdProp] !== undefined) {
            delete existing[tempIdProp];
          }
        }
        deserializeInternal(existing, itemData, seen, finalCtor);
        if (tempIdProp && existing[tempIdProp] !== undefined) {
          delete existing[tempIdProp];
        }
        newArray.push(existing);
      }
      target.length = 0;
      target.push(...newArray);
    } else {
      for (let i = 0; i < data.length; i++) {
        if (i < target.length) {
          deserializeInternal(target[i], data[i], seen, finalCtor);
        } else {
          const newItem = new finalCtor();
          deserializeInternal(newItem, data[i], seen, finalCtor);
          target.push(newItem);
        }
      }
      target.length = data.length;
    }
    seen.set(data, target);
    return target;
  }

  if (typeof target !== "object" || target === null) {
    const ctor = data?.constructor;
    if (ctor && ctor !== Object) {
      target = new ctor();
    } else {
      target = {};
    }
  }
  seen.set(data, target);

  const whitelist = collectWhitelist(target.constructor);
  const idProp = getIdProperty(target.constructor);
  const tempIdProp = getTempIdProperty(target.constructor);

  for (const prop of whitelist) {
    if (prop === idProp) continue;
    if (!(prop in data)) continue;
    const incomingValue = data[prop];
    const currentValue = target[prop];
    const arrayOfCtor = getArrayOf(target.constructor, prop);
    if (Array.isArray(currentValue) && Array.isArray(incomingValue)) {
      deserializeInternal(currentValue, incomingValue, seen, arrayOfCtor);
    } else if (
      currentValue &&
      typeof currentValue === "object" &&
      incomingValue &&
      typeof incomingValue === "object"
    ) {
      deserializeInternal(currentValue, incomingValue, seen);
    } else {
      target[prop] = deserializeInternal(currentValue, incomingValue, seen);
    }
  }
  if (tempIdProp && target[tempIdProp] !== undefined) {
    delete target[tempIdProp];
  }
  return target;
}

export function deserialize<T>(target: T | undefined | null, data: any): T {
  if (!target) {
    const ctor = data?.constructor;
    if (ctor && ctor !== Object && ctor !== Array) {
      target = new ctor();
    } else {
      throw new Error(
        "Cannot infer constructor for deserialization without existing target",
      );
    }
  }
  return deserializeInternal(target, data, new WeakMap());
}
