"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports[Symbol.toStringTag] = "Module";
var vue = require("vue");
function makeMap(str, expectsLowerCase) {
  const map = Object.create(null);
  const list = str.split(",");
  for (let i2 = 0; i2 < list.length; i2++) {
    map[list[i2]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key2) => hasOwnProperty.call(val, key2);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === "[object Map]";
const isString = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject = (val) => val !== null && typeof val === "object";
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isIntegerKey = (key2) => isString(key2) && key2 !== "NaN" && key2[0] !== "-" && "" + parseInt(key2, 10) === key2;
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const createDep = (effects) => {
  const dep = new Set(effects);
  dep.w = 0;
  dep.n = 0;
  return dep;
};
const wasTracked = (dep) => (dep.w & trackOpBit) > 0;
const newTracked = (dep) => (dep.n & trackOpBit) > 0;
const targetMap = new WeakMap();
let trackOpBit = 1;
let activeEffect;
const ITERATE_KEY = Symbol("");
const MAP_KEY_ITERATE_KEY = Symbol("");
let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function track(target, type, key2) {
  if (!isTracking()) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = new Map());
  }
  let dep = depsMap.get(key2);
  if (!dep) {
    depsMap.set(key2, dep = createDep());
  }
  trackEffects(dep);
}
function isTracking() {
  return shouldTrack && activeEffect !== void 0;
}
function trackEffects(dep, debuggerEventExtraInfo) {
  let shouldTrack2 = false;
  {
    if (!newTracked(dep)) {
      dep.n |= trackOpBit;
      shouldTrack2 = !wasTracked(dep);
    }
  }
  if (shouldTrack2) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
function trigger(target, type, key2, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let deps = [];
  if (type === "clear") {
    deps = [...depsMap.values()];
  } else if (key2 === "length" && isArray(target)) {
    depsMap.forEach((dep, key3) => {
      if (key3 === "length" || key3 >= newValue) {
        deps.push(dep);
      }
    });
  } else {
    if (key2 !== void 0) {
      deps.push(depsMap.get(key2));
    }
    switch (type) {
      case "add":
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        } else if (isIntegerKey(key2)) {
          deps.push(depsMap.get("length"));
        }
        break;
      case "delete":
        if (!isArray(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        }
        break;
      case "set":
        if (isMap(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
        }
        break;
    }
  }
  if (deps.length === 1) {
    if (deps[0]) {
      {
        triggerEffects(deps[0]);
      }
    }
  } else {
    const effects = [];
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep);
      }
    }
    {
      triggerEffects(createDep(effects));
    }
  }
}
function triggerEffects(dep, debuggerEventExtraInfo) {
  for (const effect of isArray(dep) ? dep : [...dep]) {
    if (effect !== activeEffect || effect.allowRecurse) {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  }
}
const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key2) => Symbol[key2]).filter(isSymbol));
const get = /* @__PURE__ */ createGetter();
const readonlyGet = /* @__PURE__ */ createGetter(true);
const arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
function createArrayInstrumentations() {
  const instrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key2) => {
    instrumentations[key2] = function(...args) {
      const arr = toRaw(this);
      for (let i2 = 0, l2 = this.length; i2 < l2; i2++) {
        track(arr, "get", i2 + "");
      }
      const res = arr[key2](...args);
      if (res === -1 || res === false) {
        return arr[key2](...args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  ["push", "pop", "shift", "unshift", "splice"].forEach((key2) => {
    instrumentations[key2] = function(...args) {
      pauseTracking();
      const res = toRaw(this)[key2].apply(this, args);
      resetTracking();
      return res;
    };
  });
  return instrumentations;
}
function createGetter(isReadonly = false, shallow = false) {
  return function get2(target, key2, receiver) {
    if (key2 === "__v_isReactive") {
      return !isReadonly;
    } else if (key2 === "__v_isReadonly") {
      return isReadonly;
    } else if (key2 === "__v_raw" && receiver === (isReadonly ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
      return target;
    }
    const targetIsArray = isArray(target);
    if (!isReadonly && targetIsArray && hasOwn(arrayInstrumentations, key2)) {
      return Reflect.get(arrayInstrumentations, key2, receiver);
    }
    const res = Reflect.get(target, key2, receiver);
    if (isSymbol(key2) ? builtInSymbols.has(key2) : isNonTrackableKeys(key2)) {
      return res;
    }
    if (!isReadonly) {
      track(target, "get", key2);
    }
    if (shallow) {
      return res;
    }
    if (isRef(res)) {
      const shouldUnwrap = !targetIsArray || !isIntegerKey(key2);
      return shouldUnwrap ? res.value : res;
    }
    if (isObject(res)) {
      return isReadonly ? readonly(res) : reactive(res);
    }
    return res;
  };
}
const set = /* @__PURE__ */ createSetter();
function createSetter(shallow = false) {
  return function set2(target, key2, value, receiver) {
    let oldValue = target[key2];
    if (!shallow) {
      value = toRaw(value);
      oldValue = toRaw(oldValue);
      if (!isArray(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      }
    }
    const hadKey = isArray(target) && isIntegerKey(key2) ? Number(key2) < target.length : hasOwn(target, key2);
    const result = Reflect.set(target, key2, value, receiver);
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger(target, "add", key2, value);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, "set", key2, value);
      }
    }
    return result;
  };
}
function deleteProperty(target, key2) {
  const hadKey = hasOwn(target, key2);
  target[key2];
  const result = Reflect.deleteProperty(target, key2);
  if (result && hadKey) {
    trigger(target, "delete", key2, void 0);
  }
  return result;
}
function has(target, key2) {
  const result = Reflect.has(target, key2);
  if (!isSymbol(key2) || !builtInSymbols.has(key2)) {
    track(target, "has", key2);
  }
  return result;
}
function ownKeys(target) {
  track(target, "iterate", isArray(target) ? "length" : ITERATE_KEY);
  return Reflect.ownKeys(target);
}
const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
};
const readonlyHandlers = {
  get: readonlyGet,
  set(target, key2) {
    return true;
  },
  deleteProperty(target, key2) {
    return true;
  }
};
const toReactive = (value) => isObject(value) ? reactive(value) : value;
const toReadonly = (value) => isObject(value) ? readonly(value) : value;
const toShallow = (value) => value;
const getProto = (v2) => Reflect.getPrototypeOf(v2);
function get$1(target, key2, isReadonly = false, isShallow = false) {
  target = target["__v_raw"];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key2);
  if (key2 !== rawKey) {
    !isReadonly && track(rawTarget, "get", key2);
  }
  !isReadonly && track(rawTarget, "get", rawKey);
  const { has: has2 } = getProto(rawTarget);
  const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
  if (has2.call(rawTarget, key2)) {
    return wrap(target.get(key2));
  } else if (has2.call(rawTarget, rawKey)) {
    return wrap(target.get(rawKey));
  } else if (target !== rawTarget) {
    target.get(key2);
  }
}
function has$1(key2, isReadonly = false) {
  const target = this["__v_raw"];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key2);
  if (key2 !== rawKey) {
    !isReadonly && track(rawTarget, "has", key2);
  }
  !isReadonly && track(rawTarget, "has", rawKey);
  return key2 === rawKey ? target.has(key2) : target.has(key2) || target.has(rawKey);
}
function size(target, isReadonly = false) {
  target = target["__v_raw"];
  !isReadonly && track(toRaw(target), "iterate", ITERATE_KEY);
  return Reflect.get(target, "size", target);
}
function add(value) {
  value = toRaw(value);
  const target = toRaw(this);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, value);
  if (!hadKey) {
    target.add(value);
    trigger(target, "add", value, value);
  }
  return this;
}
function set$1(key2, value) {
  value = toRaw(value);
  const target = toRaw(this);
  const { has: has2, get: get2 } = getProto(target);
  let hadKey = has2.call(target, key2);
  if (!hadKey) {
    key2 = toRaw(key2);
    hadKey = has2.call(target, key2);
  }
  const oldValue = get2.call(target, key2);
  target.set(key2, value);
  if (!hadKey) {
    trigger(target, "add", key2, value);
  } else if (hasChanged(value, oldValue)) {
    trigger(target, "set", key2, value);
  }
  return this;
}
function deleteEntry(key2) {
  const target = toRaw(this);
  const { has: has2, get: get2 } = getProto(target);
  let hadKey = has2.call(target, key2);
  if (!hadKey) {
    key2 = toRaw(key2);
    hadKey = has2.call(target, key2);
  }
  get2 ? get2.call(target, key2) : void 0;
  const result = target.delete(key2);
  if (hadKey) {
    trigger(target, "delete", key2, void 0);
  }
  return result;
}
function clear() {
  const target = toRaw(this);
  const hadItems = target.size !== 0;
  const result = target.clear();
  if (hadItems) {
    trigger(target, "clear", void 0, void 0);
  }
  return result;
}
function createForEach(isReadonly, isShallow) {
  return function forEach(callback, thisArg) {
    const observed = this;
    const target = observed["__v_raw"];
    const rawTarget = toRaw(target);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    !isReadonly && track(rawTarget, "iterate", ITERATE_KEY);
    return target.forEach((value, key2) => {
      return callback.call(thisArg, wrap(value), wrap(key2), observed);
    });
  };
}
function createIterableMethod(method, isReadonly, isShallow) {
  return function(...args) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const targetIsMap = isMap(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    !isReadonly && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
    return {
      next() {
        const { value, done } = innerIterator.next();
        return done ? { value, done } : {
          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
          done
        };
      },
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function createReadonlyMethod(type) {
  return function(...args) {
    return type === "delete" ? false : this;
  };
}
function createInstrumentations() {
  const mutableInstrumentations2 = {
    get(key2) {
      return get$1(this, key2);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false)
  };
  const shallowInstrumentations2 = {
    get(key2) {
      return get$1(this, key2, false, true);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true)
  };
  const readonlyInstrumentations2 = {
    get(key2) {
      return get$1(this, key2, true);
    },
    get size() {
      return size(this, true);
    },
    has(key2) {
      return has$1.call(this, key2, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, false)
  };
  const shallowReadonlyInstrumentations2 = {
    get(key2) {
      return get$1(this, key2, true, true);
    },
    get size() {
      return size(this, true);
    },
    has(key2) {
      return has$1.call(this, key2, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, true)
  };
  const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations2[method] = createIterableMethod(method, false, false);
    readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
    shallowInstrumentations2[method] = createIterableMethod(method, false, true);
    shallowReadonlyInstrumentations2[method] = createIterableMethod(method, true, true);
  });
  return [
    mutableInstrumentations2,
    readonlyInstrumentations2,
    shallowInstrumentations2,
    shallowReadonlyInstrumentations2
  ];
}
const [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* @__PURE__ */ createInstrumentations();
function createInstrumentationGetter(isReadonly, shallow) {
  const instrumentations = shallow ? isReadonly ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly ? readonlyInstrumentations : mutableInstrumentations;
  return (target, key2, receiver) => {
    if (key2 === "__v_isReactive") {
      return !isReadonly;
    } else if (key2 === "__v_isReadonly") {
      return isReadonly;
    } else if (key2 === "__v_raw") {
      return target;
    }
    return Reflect.get(hasOwn(instrumentations, key2) && key2 in target ? instrumentations : target, key2, receiver);
  };
}
const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
const reactiveMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function getTargetType(value) {
  return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
}
function reactive(target) {
  if (target && target["__v_isReadonly"]) {
    return target;
  }
  return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
}
function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
}
function createReactiveObject(target, isReadonly, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject(target)) {
    return target;
  }
  if (target["__v_raw"] && !(isReadonly && target["__v_isReactive"])) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}
function toRaw(observed) {
  const raw = observed && observed["__v_raw"];
  return raw ? toRaw(raw) : observed;
}
function trackRefValue(ref2) {
  if (isTracking()) {
    ref2 = toRaw(ref2);
    if (!ref2.dep) {
      ref2.dep = createDep();
    }
    {
      trackEffects(ref2.dep);
    }
  }
}
function triggerRefValue(ref2, newVal) {
  ref2 = toRaw(ref2);
  if (ref2.dep) {
    {
      triggerEffects(ref2.dep);
    }
  }
}
const convert = (val) => isObject(val) ? reactive(val) : val;
function isRef(r2) {
  return Boolean(r2 && r2.__v_isRef === true);
}
function ref(value) {
  return createRef(value, false);
}
class RefImpl {
  constructor(value, _shallow) {
    this._shallow = _shallow;
    this.dep = void 0;
    this.__v_isRef = true;
    this._rawValue = _shallow ? value : toRaw(value);
    this._value = _shallow ? value : convert(value);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newVal) {
    newVal = this._shallow ? newVal : toRaw(newVal);
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      this._value = this._shallow ? newVal : convert(newVal);
      triggerRefValue(this);
    }
  }
}
function createRef(rawValue, shallow) {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}
Promise.resolve();
function resolveTabKeyDown(e2) {
  if (e2.code === "Tab" || e2.key === "Tab" || e2.keyCode === 9) {
    e2.preventDefault();
    const text = e2.target;
    let start = text.selectionStart;
    let end2 = text.selectionEnd;
    text.value = text.value.substring(0, start) + "	" + text.value.substring(end2, text.value.length);
    text.selectionStart = start + 1;
    text.selectionEnd = end2 + 1;
  }
}
function resolveFiesUpdate(e2) {
  var _a;
  e2.preventDefault();
  e2.stopPropagation();
  if ((_a = e2 == null ? void 0 : e2.dataTransfer) == null ? void 0 : _a.files) {
    const filelist = e2.dataTransfer.files;
    const files = [];
    if (filelist) {
      for (let i2 = 0; i2 < filelist.length; i2++) {
        const file = filelist.item(i2);
        if (file !== null) {
          files.push(file);
        }
      }
    }
    return files;
  }
  return [];
}
const MdEditor = vue.defineComponent({
  name: "MdEditor",
  props: {
    modelValue: String,
    renderKeys: {
      type: Array,
      default: []
    }
  },
  emits: ["update:modelValue", "filesUpdate"],
  setup(props, {
    slots,
    attrs,
    emit
  }) {
    const {
      renderKeys
    } = vue.toRefs(props);
    const content = ref("");
    const onChange = (e2) => {
      content.value = e2.target.value;
      emit("update:modelValue", e2.target.value);
    };
    return () => vue.createVNode("textarea", {
      "data-render-keys": renderKeys.value,
      "onDrop": (e2) => emit("filesUpdate", resolveFiesUpdate(e2)),
      "onInput": onChange,
      "onKeydown": resolveTabKeyDown
    }, null);
  }
});
const grinning = "\u{1F600}";
const smiley = "\u{1F603}";
const smile = "\u{1F604}";
const grin = "\u{1F601}";
const laughing = "\u{1F606}";
const satisfied = "\u{1F606}";
const sweat_smile = "\u{1F605}";
const rofl = "\u{1F923}";
const joy = "\u{1F602}";
const slightly_smiling_face = "\u{1F642}";
const upside_down_face = "\u{1F643}";
const wink = "\u{1F609}";
const blush = "\u{1F60A}";
const innocent = "\u{1F607}";
const smiling_face_with_three_hearts = "\u{1F970}";
const heart_eyes = "\u{1F60D}";
const star_struck = "\u{1F929}";
const kissing_heart = "\u{1F618}";
const kissing = "\u{1F617}";
const relaxed = "\u263A\uFE0F";
const kissing_closed_eyes = "\u{1F61A}";
const kissing_smiling_eyes = "\u{1F619}";
const smiling_face_with_tear = "\u{1F972}";
const yum = "\u{1F60B}";
const stuck_out_tongue = "\u{1F61B}";
const stuck_out_tongue_winking_eye = "\u{1F61C}";
const zany_face = "\u{1F92A}";
const stuck_out_tongue_closed_eyes = "\u{1F61D}";
const money_mouth_face = "\u{1F911}";
const hugs = "\u{1F917}";
const hand_over_mouth = "\u{1F92D}";
const shushing_face = "\u{1F92B}";
const thinking = "\u{1F914}";
const zipper_mouth_face = "\u{1F910}";
const raised_eyebrow = "\u{1F928}";
const neutral_face = "\u{1F610}";
const expressionless = "\u{1F611}";
const no_mouth = "\u{1F636}";
const smirk = "\u{1F60F}";
const unamused = "\u{1F612}";
const roll_eyes = "\u{1F644}";
const grimacing = "\u{1F62C}";
const lying_face = "\u{1F925}";
const relieved = "\u{1F60C}";
const pensive = "\u{1F614}";
const sleepy = "\u{1F62A}";
const drooling_face = "\u{1F924}";
const sleeping = "\u{1F634}";
const mask = "\u{1F637}";
const face_with_thermometer = "\u{1F912}";
const face_with_head_bandage = "\u{1F915}";
const nauseated_face = "\u{1F922}";
const vomiting_face = "\u{1F92E}";
const sneezing_face = "\u{1F927}";
const hot_face = "\u{1F975}";
const cold_face = "\u{1F976}";
const woozy_face = "\u{1F974}";
const dizzy_face = "\u{1F635}";
const exploding_head = "\u{1F92F}";
const cowboy_hat_face = "\u{1F920}";
const partying_face = "\u{1F973}";
const disguised_face = "\u{1F978}";
const sunglasses = "\u{1F60E}";
const nerd_face = "\u{1F913}";
const monocle_face = "\u{1F9D0}";
const confused = "\u{1F615}";
const worried = "\u{1F61F}";
const slightly_frowning_face = "\u{1F641}";
const frowning_face = "\u2639\uFE0F";
const open_mouth = "\u{1F62E}";
const hushed = "\u{1F62F}";
const astonished = "\u{1F632}";
const flushed = "\u{1F633}";
const pleading_face = "\u{1F97A}";
const frowning = "\u{1F626}";
const anguished = "\u{1F627}";
const fearful = "\u{1F628}";
const cold_sweat = "\u{1F630}";
const disappointed_relieved = "\u{1F625}";
const cry = "\u{1F622}";
const sob = "\u{1F62D}";
const scream = "\u{1F631}";
const confounded = "\u{1F616}";
const persevere = "\u{1F623}";
const disappointed = "\u{1F61E}";
const sweat = "\u{1F613}";
const weary = "\u{1F629}";
const tired_face = "\u{1F62B}";
const yawning_face = "\u{1F971}";
const triumph = "\u{1F624}";
const rage = "\u{1F621}";
const pout = "\u{1F621}";
const angry = "\u{1F620}";
const cursing_face = "\u{1F92C}";
const smiling_imp = "\u{1F608}";
const imp = "\u{1F47F}";
const skull = "\u{1F480}";
const skull_and_crossbones = "\u2620\uFE0F";
const hankey = "\u{1F4A9}";
const poop = "\u{1F4A9}";
const shit = "\u{1F4A9}";
const clown_face = "\u{1F921}";
const japanese_ogre = "\u{1F479}";
const japanese_goblin = "\u{1F47A}";
const ghost = "\u{1F47B}";
const alien = "\u{1F47D}";
const space_invader = "\u{1F47E}";
const robot = "\u{1F916}";
const smiley_cat = "\u{1F63A}";
const smile_cat = "\u{1F638}";
const joy_cat = "\u{1F639}";
const heart_eyes_cat = "\u{1F63B}";
const smirk_cat = "\u{1F63C}";
const kissing_cat = "\u{1F63D}";
const scream_cat = "\u{1F640}";
const crying_cat_face = "\u{1F63F}";
const pouting_cat = "\u{1F63E}";
const see_no_evil = "\u{1F648}";
const hear_no_evil = "\u{1F649}";
const speak_no_evil = "\u{1F64A}";
const kiss = "\u{1F48B}";
const love_letter = "\u{1F48C}";
const cupid = "\u{1F498}";
const gift_heart = "\u{1F49D}";
const sparkling_heart = "\u{1F496}";
const heartpulse = "\u{1F497}";
const heartbeat = "\u{1F493}";
const revolving_hearts = "\u{1F49E}";
const two_hearts = "\u{1F495}";
const heart_decoration = "\u{1F49F}";
const heavy_heart_exclamation = "\u2763\uFE0F";
const broken_heart = "\u{1F494}";
const heart = "\u2764\uFE0F";
const orange_heart = "\u{1F9E1}";
const yellow_heart = "\u{1F49B}";
const green_heart = "\u{1F49A}";
const blue_heart = "\u{1F499}";
const purple_heart = "\u{1F49C}";
const brown_heart = "\u{1F90E}";
const black_heart = "\u{1F5A4}";
const white_heart = "\u{1F90D}";
const anger = "\u{1F4A2}";
const boom = "\u{1F4A5}";
const collision = "\u{1F4A5}";
const dizzy = "\u{1F4AB}";
const sweat_drops = "\u{1F4A6}";
const dash = "\u{1F4A8}";
const hole = "\u{1F573}\uFE0F";
const bomb = "\u{1F4A3}";
const speech_balloon = "\u{1F4AC}";
const eye_speech_bubble = "\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F";
const left_speech_bubble = "\u{1F5E8}\uFE0F";
const right_anger_bubble = "\u{1F5EF}\uFE0F";
const thought_balloon = "\u{1F4AD}";
const zzz = "\u{1F4A4}";
const wave = "\u{1F44B}";
const raised_back_of_hand = "\u{1F91A}";
const raised_hand_with_fingers_splayed = "\u{1F590}\uFE0F";
const hand = "\u270B";
const raised_hand = "\u270B";
const vulcan_salute = "\u{1F596}";
const ok_hand = "\u{1F44C}";
const pinched_fingers = "\u{1F90C}";
const pinching_hand = "\u{1F90F}";
const v = "\u270C\uFE0F";
const crossed_fingers = "\u{1F91E}";
const love_you_gesture = "\u{1F91F}";
const metal = "\u{1F918}";
const call_me_hand = "\u{1F919}";
const point_left = "\u{1F448}";
const point_right = "\u{1F449}";
const point_up_2 = "\u{1F446}";
const middle_finger = "\u{1F595}";
const fu = "\u{1F595}";
const point_down = "\u{1F447}";
const point_up = "\u261D\uFE0F";
const thumbsup = "\u{1F44D}";
const thumbsdown = "\u{1F44E}";
const fist_raised = "\u270A";
const fist = "\u270A";
const fist_oncoming = "\u{1F44A}";
const facepunch = "\u{1F44A}";
const punch = "\u{1F44A}";
const fist_left = "\u{1F91B}";
const fist_right = "\u{1F91C}";
const clap = "\u{1F44F}";
const raised_hands = "\u{1F64C}";
const open_hands = "\u{1F450}";
const palms_up_together = "\u{1F932}";
const handshake = "\u{1F91D}";
const pray = "\u{1F64F}";
const writing_hand = "\u270D\uFE0F";
const nail_care = "\u{1F485}";
const selfie = "\u{1F933}";
const muscle = "\u{1F4AA}";
const mechanical_arm = "\u{1F9BE}";
const mechanical_leg = "\u{1F9BF}";
const leg = "\u{1F9B5}";
const foot = "\u{1F9B6}";
const ear = "\u{1F442}";
const ear_with_hearing_aid = "\u{1F9BB}";
const nose = "\u{1F443}";
const brain = "\u{1F9E0}";
const anatomical_heart = "\u{1FAC0}";
const lungs = "\u{1FAC1}";
const tooth = "\u{1F9B7}";
const bone = "\u{1F9B4}";
const eyes = "\u{1F440}";
const eye = "\u{1F441}\uFE0F";
const tongue = "\u{1F445}";
const lips = "\u{1F444}";
const baby = "\u{1F476}";
const child = "\u{1F9D2}";
const boy = "\u{1F466}";
const girl = "\u{1F467}";
const adult = "\u{1F9D1}";
const blond_haired_person = "\u{1F471}";
const man = "\u{1F468}";
const bearded_person = "\u{1F9D4}";
const red_haired_man = "\u{1F468}\u200D\u{1F9B0}";
const curly_haired_man = "\u{1F468}\u200D\u{1F9B1}";
const white_haired_man = "\u{1F468}\u200D\u{1F9B3}";
const bald_man = "\u{1F468}\u200D\u{1F9B2}";
const woman = "\u{1F469}";
const red_haired_woman = "\u{1F469}\u200D\u{1F9B0}";
const person_red_hair = "\u{1F9D1}\u200D\u{1F9B0}";
const curly_haired_woman = "\u{1F469}\u200D\u{1F9B1}";
const person_curly_hair = "\u{1F9D1}\u200D\u{1F9B1}";
const white_haired_woman = "\u{1F469}\u200D\u{1F9B3}";
const person_white_hair = "\u{1F9D1}\u200D\u{1F9B3}";
const bald_woman = "\u{1F469}\u200D\u{1F9B2}";
const person_bald = "\u{1F9D1}\u200D\u{1F9B2}";
const blond_haired_woman = "\u{1F471}\u200D\u2640\uFE0F";
const blonde_woman = "\u{1F471}\u200D\u2640\uFE0F";
const blond_haired_man = "\u{1F471}\u200D\u2642\uFE0F";
const older_adult = "\u{1F9D3}";
const older_man = "\u{1F474}";
const older_woman = "\u{1F475}";
const frowning_person = "\u{1F64D}";
const frowning_man = "\u{1F64D}\u200D\u2642\uFE0F";
const frowning_woman = "\u{1F64D}\u200D\u2640\uFE0F";
const pouting_face = "\u{1F64E}";
const pouting_man = "\u{1F64E}\u200D\u2642\uFE0F";
const pouting_woman = "\u{1F64E}\u200D\u2640\uFE0F";
const no_good = "\u{1F645}";
const no_good_man = "\u{1F645}\u200D\u2642\uFE0F";
const ng_man = "\u{1F645}\u200D\u2642\uFE0F";
const no_good_woman = "\u{1F645}\u200D\u2640\uFE0F";
const ng_woman = "\u{1F645}\u200D\u2640\uFE0F";
const ok_person = "\u{1F646}";
const ok_man = "\u{1F646}\u200D\u2642\uFE0F";
const ok_woman = "\u{1F646}\u200D\u2640\uFE0F";
const tipping_hand_person = "\u{1F481}";
const information_desk_person = "\u{1F481}";
const tipping_hand_man = "\u{1F481}\u200D\u2642\uFE0F";
const sassy_man = "\u{1F481}\u200D\u2642\uFE0F";
const tipping_hand_woman = "\u{1F481}\u200D\u2640\uFE0F";
const sassy_woman = "\u{1F481}\u200D\u2640\uFE0F";
const raising_hand = "\u{1F64B}";
const raising_hand_man = "\u{1F64B}\u200D\u2642\uFE0F";
const raising_hand_woman = "\u{1F64B}\u200D\u2640\uFE0F";
const deaf_person = "\u{1F9CF}";
const deaf_man = "\u{1F9CF}\u200D\u2642\uFE0F";
const deaf_woman = "\u{1F9CF}\u200D\u2640\uFE0F";
const bow = "\u{1F647}";
const bowing_man = "\u{1F647}\u200D\u2642\uFE0F";
const bowing_woman = "\u{1F647}\u200D\u2640\uFE0F";
const facepalm = "\u{1F926}";
const man_facepalming = "\u{1F926}\u200D\u2642\uFE0F";
const woman_facepalming = "\u{1F926}\u200D\u2640\uFE0F";
const shrug = "\u{1F937}";
const man_shrugging = "\u{1F937}\u200D\u2642\uFE0F";
const woman_shrugging = "\u{1F937}\u200D\u2640\uFE0F";
const health_worker = "\u{1F9D1}\u200D\u2695\uFE0F";
const man_health_worker = "\u{1F468}\u200D\u2695\uFE0F";
const woman_health_worker = "\u{1F469}\u200D\u2695\uFE0F";
const student = "\u{1F9D1}\u200D\u{1F393}";
const man_student = "\u{1F468}\u200D\u{1F393}";
const woman_student = "\u{1F469}\u200D\u{1F393}";
const teacher = "\u{1F9D1}\u200D\u{1F3EB}";
const man_teacher = "\u{1F468}\u200D\u{1F3EB}";
const woman_teacher = "\u{1F469}\u200D\u{1F3EB}";
const judge = "\u{1F9D1}\u200D\u2696\uFE0F";
const man_judge = "\u{1F468}\u200D\u2696\uFE0F";
const woman_judge = "\u{1F469}\u200D\u2696\uFE0F";
const farmer = "\u{1F9D1}\u200D\u{1F33E}";
const man_farmer = "\u{1F468}\u200D\u{1F33E}";
const woman_farmer = "\u{1F469}\u200D\u{1F33E}";
const cook = "\u{1F9D1}\u200D\u{1F373}";
const man_cook = "\u{1F468}\u200D\u{1F373}";
const woman_cook = "\u{1F469}\u200D\u{1F373}";
const mechanic = "\u{1F9D1}\u200D\u{1F527}";
const man_mechanic = "\u{1F468}\u200D\u{1F527}";
const woman_mechanic = "\u{1F469}\u200D\u{1F527}";
const factory_worker = "\u{1F9D1}\u200D\u{1F3ED}";
const man_factory_worker = "\u{1F468}\u200D\u{1F3ED}";
const woman_factory_worker = "\u{1F469}\u200D\u{1F3ED}";
const office_worker = "\u{1F9D1}\u200D\u{1F4BC}";
const man_office_worker = "\u{1F468}\u200D\u{1F4BC}";
const woman_office_worker = "\u{1F469}\u200D\u{1F4BC}";
const scientist = "\u{1F9D1}\u200D\u{1F52C}";
const man_scientist = "\u{1F468}\u200D\u{1F52C}";
const woman_scientist = "\u{1F469}\u200D\u{1F52C}";
const technologist = "\u{1F9D1}\u200D\u{1F4BB}";
const man_technologist = "\u{1F468}\u200D\u{1F4BB}";
const woman_technologist = "\u{1F469}\u200D\u{1F4BB}";
const singer = "\u{1F9D1}\u200D\u{1F3A4}";
const man_singer = "\u{1F468}\u200D\u{1F3A4}";
const woman_singer = "\u{1F469}\u200D\u{1F3A4}";
const artist = "\u{1F9D1}\u200D\u{1F3A8}";
const man_artist = "\u{1F468}\u200D\u{1F3A8}";
const woman_artist = "\u{1F469}\u200D\u{1F3A8}";
const pilot = "\u{1F9D1}\u200D\u2708\uFE0F";
const man_pilot = "\u{1F468}\u200D\u2708\uFE0F";
const woman_pilot = "\u{1F469}\u200D\u2708\uFE0F";
const astronaut = "\u{1F9D1}\u200D\u{1F680}";
const man_astronaut = "\u{1F468}\u200D\u{1F680}";
const woman_astronaut = "\u{1F469}\u200D\u{1F680}";
const firefighter = "\u{1F9D1}\u200D\u{1F692}";
const man_firefighter = "\u{1F468}\u200D\u{1F692}";
const woman_firefighter = "\u{1F469}\u200D\u{1F692}";
const police_officer = "\u{1F46E}";
const cop = "\u{1F46E}";
const policeman = "\u{1F46E}\u200D\u2642\uFE0F";
const policewoman = "\u{1F46E}\u200D\u2640\uFE0F";
const detective = "\u{1F575}\uFE0F";
const male_detective = "\u{1F575}\uFE0F\u200D\u2642\uFE0F";
const female_detective = "\u{1F575}\uFE0F\u200D\u2640\uFE0F";
const guard = "\u{1F482}";
const guardsman = "\u{1F482}\u200D\u2642\uFE0F";
const guardswoman = "\u{1F482}\u200D\u2640\uFE0F";
const ninja = "\u{1F977}";
const construction_worker = "\u{1F477}";
const construction_worker_man = "\u{1F477}\u200D\u2642\uFE0F";
const construction_worker_woman = "\u{1F477}\u200D\u2640\uFE0F";
const prince = "\u{1F934}";
const princess = "\u{1F478}";
const person_with_turban = "\u{1F473}";
const man_with_turban = "\u{1F473}\u200D\u2642\uFE0F";
const woman_with_turban = "\u{1F473}\u200D\u2640\uFE0F";
const man_with_gua_pi_mao = "\u{1F472}";
const woman_with_headscarf = "\u{1F9D5}";
const person_in_tuxedo = "\u{1F935}";
const man_in_tuxedo = "\u{1F935}\u200D\u2642\uFE0F";
const woman_in_tuxedo = "\u{1F935}\u200D\u2640\uFE0F";
const person_with_veil = "\u{1F470}";
const man_with_veil = "\u{1F470}\u200D\u2642\uFE0F";
const woman_with_veil = "\u{1F470}\u200D\u2640\uFE0F";
const bride_with_veil = "\u{1F470}\u200D\u2640\uFE0F";
const pregnant_woman = "\u{1F930}";
const breast_feeding = "\u{1F931}";
const woman_feeding_baby = "\u{1F469}\u200D\u{1F37C}";
const man_feeding_baby = "\u{1F468}\u200D\u{1F37C}";
const person_feeding_baby = "\u{1F9D1}\u200D\u{1F37C}";
const angel = "\u{1F47C}";
const santa = "\u{1F385}";
const mrs_claus = "\u{1F936}";
const mx_claus = "\u{1F9D1}\u200D\u{1F384}";
const superhero = "\u{1F9B8}";
const superhero_man = "\u{1F9B8}\u200D\u2642\uFE0F";
const superhero_woman = "\u{1F9B8}\u200D\u2640\uFE0F";
const supervillain = "\u{1F9B9}";
const supervillain_man = "\u{1F9B9}\u200D\u2642\uFE0F";
const supervillain_woman = "\u{1F9B9}\u200D\u2640\uFE0F";
const mage = "\u{1F9D9}";
const mage_man = "\u{1F9D9}\u200D\u2642\uFE0F";
const mage_woman = "\u{1F9D9}\u200D\u2640\uFE0F";
const fairy = "\u{1F9DA}";
const fairy_man = "\u{1F9DA}\u200D\u2642\uFE0F";
const fairy_woman = "\u{1F9DA}\u200D\u2640\uFE0F";
const vampire = "\u{1F9DB}";
const vampire_man = "\u{1F9DB}\u200D\u2642\uFE0F";
const vampire_woman = "\u{1F9DB}\u200D\u2640\uFE0F";
const merperson = "\u{1F9DC}";
const merman = "\u{1F9DC}\u200D\u2642\uFE0F";
const mermaid = "\u{1F9DC}\u200D\u2640\uFE0F";
const elf = "\u{1F9DD}";
const elf_man = "\u{1F9DD}\u200D\u2642\uFE0F";
const elf_woman = "\u{1F9DD}\u200D\u2640\uFE0F";
const genie = "\u{1F9DE}";
const genie_man = "\u{1F9DE}\u200D\u2642\uFE0F";
const genie_woman = "\u{1F9DE}\u200D\u2640\uFE0F";
const zombie = "\u{1F9DF}";
const zombie_man = "\u{1F9DF}\u200D\u2642\uFE0F";
const zombie_woman = "\u{1F9DF}\u200D\u2640\uFE0F";
const massage = "\u{1F486}";
const massage_man = "\u{1F486}\u200D\u2642\uFE0F";
const massage_woman = "\u{1F486}\u200D\u2640\uFE0F";
const haircut = "\u{1F487}";
const haircut_man = "\u{1F487}\u200D\u2642\uFE0F";
const haircut_woman = "\u{1F487}\u200D\u2640\uFE0F";
const walking = "\u{1F6B6}";
const walking_man = "\u{1F6B6}\u200D\u2642\uFE0F";
const walking_woman = "\u{1F6B6}\u200D\u2640\uFE0F";
const standing_person = "\u{1F9CD}";
const standing_man = "\u{1F9CD}\u200D\u2642\uFE0F";
const standing_woman = "\u{1F9CD}\u200D\u2640\uFE0F";
const kneeling_person = "\u{1F9CE}";
const kneeling_man = "\u{1F9CE}\u200D\u2642\uFE0F";
const kneeling_woman = "\u{1F9CE}\u200D\u2640\uFE0F";
const person_with_probing_cane = "\u{1F9D1}\u200D\u{1F9AF}";
const man_with_probing_cane = "\u{1F468}\u200D\u{1F9AF}";
const woman_with_probing_cane = "\u{1F469}\u200D\u{1F9AF}";
const person_in_motorized_wheelchair = "\u{1F9D1}\u200D\u{1F9BC}";
const man_in_motorized_wheelchair = "\u{1F468}\u200D\u{1F9BC}";
const woman_in_motorized_wheelchair = "\u{1F469}\u200D\u{1F9BC}";
const person_in_manual_wheelchair = "\u{1F9D1}\u200D\u{1F9BD}";
const man_in_manual_wheelchair = "\u{1F468}\u200D\u{1F9BD}";
const woman_in_manual_wheelchair = "\u{1F469}\u200D\u{1F9BD}";
const runner = "\u{1F3C3}";
const running = "\u{1F3C3}";
const running_man = "\u{1F3C3}\u200D\u2642\uFE0F";
const running_woman = "\u{1F3C3}\u200D\u2640\uFE0F";
const woman_dancing = "\u{1F483}";
const dancer = "\u{1F483}";
const man_dancing = "\u{1F57A}";
const business_suit_levitating = "\u{1F574}\uFE0F";
const dancers = "\u{1F46F}";
const dancing_men = "\u{1F46F}\u200D\u2642\uFE0F";
const dancing_women = "\u{1F46F}\u200D\u2640\uFE0F";
const sauna_person = "\u{1F9D6}";
const sauna_man = "\u{1F9D6}\u200D\u2642\uFE0F";
const sauna_woman = "\u{1F9D6}\u200D\u2640\uFE0F";
const climbing = "\u{1F9D7}";
const climbing_man = "\u{1F9D7}\u200D\u2642\uFE0F";
const climbing_woman = "\u{1F9D7}\u200D\u2640\uFE0F";
const person_fencing = "\u{1F93A}";
const horse_racing = "\u{1F3C7}";
const skier = "\u26F7\uFE0F";
const snowboarder = "\u{1F3C2}";
const golfing = "\u{1F3CC}\uFE0F";
const golfing_man = "\u{1F3CC}\uFE0F\u200D\u2642\uFE0F";
const golfing_woman = "\u{1F3CC}\uFE0F\u200D\u2640\uFE0F";
const surfer = "\u{1F3C4}";
const surfing_man = "\u{1F3C4}\u200D\u2642\uFE0F";
const surfing_woman = "\u{1F3C4}\u200D\u2640\uFE0F";
const rowboat = "\u{1F6A3}";
const rowing_man = "\u{1F6A3}\u200D\u2642\uFE0F";
const rowing_woman = "\u{1F6A3}\u200D\u2640\uFE0F";
const swimmer = "\u{1F3CA}";
const swimming_man = "\u{1F3CA}\u200D\u2642\uFE0F";
const swimming_woman = "\u{1F3CA}\u200D\u2640\uFE0F";
const bouncing_ball_person = "\u26F9\uFE0F";
const bouncing_ball_man = "\u26F9\uFE0F\u200D\u2642\uFE0F";
const basketball_man = "\u26F9\uFE0F\u200D\u2642\uFE0F";
const bouncing_ball_woman = "\u26F9\uFE0F\u200D\u2640\uFE0F";
const basketball_woman = "\u26F9\uFE0F\u200D\u2640\uFE0F";
const weight_lifting = "\u{1F3CB}\uFE0F";
const weight_lifting_man = "\u{1F3CB}\uFE0F\u200D\u2642\uFE0F";
const weight_lifting_woman = "\u{1F3CB}\uFE0F\u200D\u2640\uFE0F";
const bicyclist = "\u{1F6B4}";
const biking_man = "\u{1F6B4}\u200D\u2642\uFE0F";
const biking_woman = "\u{1F6B4}\u200D\u2640\uFE0F";
const mountain_bicyclist = "\u{1F6B5}";
const mountain_biking_man = "\u{1F6B5}\u200D\u2642\uFE0F";
const mountain_biking_woman = "\u{1F6B5}\u200D\u2640\uFE0F";
const cartwheeling = "\u{1F938}";
const man_cartwheeling = "\u{1F938}\u200D\u2642\uFE0F";
const woman_cartwheeling = "\u{1F938}\u200D\u2640\uFE0F";
const wrestling = "\u{1F93C}";
const men_wrestling = "\u{1F93C}\u200D\u2642\uFE0F";
const women_wrestling = "\u{1F93C}\u200D\u2640\uFE0F";
const water_polo = "\u{1F93D}";
const man_playing_water_polo = "\u{1F93D}\u200D\u2642\uFE0F";
const woman_playing_water_polo = "\u{1F93D}\u200D\u2640\uFE0F";
const handball_person = "\u{1F93E}";
const man_playing_handball = "\u{1F93E}\u200D\u2642\uFE0F";
const woman_playing_handball = "\u{1F93E}\u200D\u2640\uFE0F";
const juggling_person = "\u{1F939}";
const man_juggling = "\u{1F939}\u200D\u2642\uFE0F";
const woman_juggling = "\u{1F939}\u200D\u2640\uFE0F";
const lotus_position = "\u{1F9D8}";
const lotus_position_man = "\u{1F9D8}\u200D\u2642\uFE0F";
const lotus_position_woman = "\u{1F9D8}\u200D\u2640\uFE0F";
const bath = "\u{1F6C0}";
const sleeping_bed = "\u{1F6CC}";
const people_holding_hands = "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}";
const two_women_holding_hands = "\u{1F46D}";
const couple = "\u{1F46B}";
const two_men_holding_hands = "\u{1F46C}";
const couplekiss = "\u{1F48F}";
const couplekiss_man_woman = "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}";
const couplekiss_man_man = "\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}";
const couplekiss_woman_woman = "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}";
const couple_with_heart = "\u{1F491}";
const couple_with_heart_woman_man = "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}";
const couple_with_heart_man_man = "\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F468}";
const couple_with_heart_woman_woman = "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F469}";
const family = "\u{1F46A}";
const family_man_woman_boy = "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}";
const family_man_woman_girl = "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}";
const family_man_woman_girl_boy = "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}";
const family_man_woman_boy_boy = "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}";
const family_man_woman_girl_girl = "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}";
const family_man_man_boy = "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}";
const family_man_man_girl = "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}";
const family_man_man_girl_boy = "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F466}";
const family_man_man_boy_boy = "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}\u200D\u{1F466}";
const family_man_man_girl_girl = "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F467}";
const family_woman_woman_boy = "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}";
const family_woman_woman_girl = "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}";
const family_woman_woman_girl_boy = "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}";
const family_woman_woman_boy_boy = "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}";
const family_woman_woman_girl_girl = "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}";
const family_man_boy = "\u{1F468}\u200D\u{1F466}";
const family_man_boy_boy = "\u{1F468}\u200D\u{1F466}\u200D\u{1F466}";
const family_man_girl = "\u{1F468}\u200D\u{1F467}";
const family_man_girl_boy = "\u{1F468}\u200D\u{1F467}\u200D\u{1F466}";
const family_man_girl_girl = "\u{1F468}\u200D\u{1F467}\u200D\u{1F467}";
const family_woman_boy = "\u{1F469}\u200D\u{1F466}";
const family_woman_boy_boy = "\u{1F469}\u200D\u{1F466}\u200D\u{1F466}";
const family_woman_girl = "\u{1F469}\u200D\u{1F467}";
const family_woman_girl_boy = "\u{1F469}\u200D\u{1F467}\u200D\u{1F466}";
const family_woman_girl_girl = "\u{1F469}\u200D\u{1F467}\u200D\u{1F467}";
const speaking_head = "\u{1F5E3}\uFE0F";
const bust_in_silhouette = "\u{1F464}";
const busts_in_silhouette = "\u{1F465}";
const people_hugging = "\u{1FAC2}";
const footprints = "\u{1F463}";
const monkey_face = "\u{1F435}";
const monkey = "\u{1F412}";
const gorilla = "\u{1F98D}";
const orangutan = "\u{1F9A7}";
const dog = "\u{1F436}";
const dog2 = "\u{1F415}";
const guide_dog = "\u{1F9AE}";
const service_dog = "\u{1F415}\u200D\u{1F9BA}";
const poodle = "\u{1F429}";
const wolf = "\u{1F43A}";
const fox_face = "\u{1F98A}";
const raccoon = "\u{1F99D}";
const cat = "\u{1F431}";
const cat2 = "\u{1F408}";
const black_cat = "\u{1F408}\u200D\u2B1B";
const lion = "\u{1F981}";
const tiger = "\u{1F42F}";
const tiger2 = "\u{1F405}";
const leopard = "\u{1F406}";
const horse = "\u{1F434}";
const racehorse = "\u{1F40E}";
const unicorn = "\u{1F984}";
const zebra = "\u{1F993}";
const deer = "\u{1F98C}";
const bison = "\u{1F9AC}";
const cow = "\u{1F42E}";
const ox = "\u{1F402}";
const water_buffalo = "\u{1F403}";
const cow2 = "\u{1F404}";
const pig = "\u{1F437}";
const pig2 = "\u{1F416}";
const boar = "\u{1F417}";
const pig_nose = "\u{1F43D}";
const ram = "\u{1F40F}";
const sheep = "\u{1F411}";
const goat = "\u{1F410}";
const dromedary_camel = "\u{1F42A}";
const camel = "\u{1F42B}";
const llama = "\u{1F999}";
const giraffe = "\u{1F992}";
const elephant = "\u{1F418}";
const mammoth = "\u{1F9A3}";
const rhinoceros = "\u{1F98F}";
const hippopotamus = "\u{1F99B}";
const mouse = "\u{1F42D}";
const mouse2 = "\u{1F401}";
const rat = "\u{1F400}";
const hamster = "\u{1F439}";
const rabbit = "\u{1F430}";
const rabbit2 = "\u{1F407}";
const chipmunk = "\u{1F43F}\uFE0F";
const beaver = "\u{1F9AB}";
const hedgehog = "\u{1F994}";
const bat = "\u{1F987}";
const bear = "\u{1F43B}";
const polar_bear = "\u{1F43B}\u200D\u2744\uFE0F";
const koala = "\u{1F428}";
const panda_face = "\u{1F43C}";
const sloth = "\u{1F9A5}";
const otter = "\u{1F9A6}";
const skunk = "\u{1F9A8}";
const kangaroo = "\u{1F998}";
const badger = "\u{1F9A1}";
const feet = "\u{1F43E}";
const paw_prints = "\u{1F43E}";
const turkey = "\u{1F983}";
const chicken = "\u{1F414}";
const rooster = "\u{1F413}";
const hatching_chick = "\u{1F423}";
const baby_chick = "\u{1F424}";
const hatched_chick = "\u{1F425}";
const bird = "\u{1F426}";
const penguin = "\u{1F427}";
const dove = "\u{1F54A}\uFE0F";
const eagle = "\u{1F985}";
const duck = "\u{1F986}";
const swan = "\u{1F9A2}";
const owl = "\u{1F989}";
const dodo = "\u{1F9A4}";
const feather = "\u{1FAB6}";
const flamingo = "\u{1F9A9}";
const peacock = "\u{1F99A}";
const parrot = "\u{1F99C}";
const frog = "\u{1F438}";
const crocodile = "\u{1F40A}";
const turtle = "\u{1F422}";
const lizard = "\u{1F98E}";
const snake = "\u{1F40D}";
const dragon_face = "\u{1F432}";
const dragon = "\u{1F409}";
const sauropod = "\u{1F995}";
const whale = "\u{1F433}";
const whale2 = "\u{1F40B}";
const dolphin = "\u{1F42C}";
const flipper = "\u{1F42C}";
const seal = "\u{1F9AD}";
const fish = "\u{1F41F}";
const tropical_fish = "\u{1F420}";
const blowfish = "\u{1F421}";
const shark = "\u{1F988}";
const octopus = "\u{1F419}";
const shell = "\u{1F41A}";
const snail = "\u{1F40C}";
const butterfly = "\u{1F98B}";
const bug = "\u{1F41B}";
const ant = "\u{1F41C}";
const bee = "\u{1F41D}";
const honeybee = "\u{1F41D}";
const beetle = "\u{1FAB2}";
const lady_beetle = "\u{1F41E}";
const cricket = "\u{1F997}";
const cockroach = "\u{1FAB3}";
const spider = "\u{1F577}\uFE0F";
const spider_web = "\u{1F578}\uFE0F";
const scorpion = "\u{1F982}";
const mosquito = "\u{1F99F}";
const fly = "\u{1FAB0}";
const worm = "\u{1FAB1}";
const microbe = "\u{1F9A0}";
const bouquet = "\u{1F490}";
const cherry_blossom = "\u{1F338}";
const white_flower = "\u{1F4AE}";
const rosette = "\u{1F3F5}\uFE0F";
const rose = "\u{1F339}";
const wilted_flower = "\u{1F940}";
const hibiscus = "\u{1F33A}";
const sunflower = "\u{1F33B}";
const blossom = "\u{1F33C}";
const tulip = "\u{1F337}";
const seedling = "\u{1F331}";
const potted_plant = "\u{1FAB4}";
const evergreen_tree = "\u{1F332}";
const deciduous_tree = "\u{1F333}";
const palm_tree = "\u{1F334}";
const cactus = "\u{1F335}";
const ear_of_rice = "\u{1F33E}";
const herb = "\u{1F33F}";
const shamrock = "\u2618\uFE0F";
const four_leaf_clover = "\u{1F340}";
const maple_leaf = "\u{1F341}";
const fallen_leaf = "\u{1F342}";
const leaves = "\u{1F343}";
const grapes = "\u{1F347}";
const melon = "\u{1F348}";
const watermelon = "\u{1F349}";
const tangerine = "\u{1F34A}";
const orange = "\u{1F34A}";
const mandarin = "\u{1F34A}";
const lemon = "\u{1F34B}";
const banana = "\u{1F34C}";
const pineapple = "\u{1F34D}";
const mango = "\u{1F96D}";
const apple = "\u{1F34E}";
const green_apple = "\u{1F34F}";
const pear = "\u{1F350}";
const peach = "\u{1F351}";
const cherries = "\u{1F352}";
const strawberry = "\u{1F353}";
const blueberries = "\u{1FAD0}";
const kiwi_fruit = "\u{1F95D}";
const tomato = "\u{1F345}";
const olive = "\u{1FAD2}";
const coconut = "\u{1F965}";
const avocado = "\u{1F951}";
const eggplant = "\u{1F346}";
const potato = "\u{1F954}";
const carrot = "\u{1F955}";
const corn = "\u{1F33D}";
const hot_pepper = "\u{1F336}\uFE0F";
const bell_pepper = "\u{1FAD1}";
const cucumber = "\u{1F952}";
const leafy_green = "\u{1F96C}";
const broccoli = "\u{1F966}";
const garlic = "\u{1F9C4}";
const onion = "\u{1F9C5}";
const mushroom = "\u{1F344}";
const peanuts = "\u{1F95C}";
const chestnut = "\u{1F330}";
const bread = "\u{1F35E}";
const croissant = "\u{1F950}";
const baguette_bread = "\u{1F956}";
const flatbread = "\u{1FAD3}";
const pretzel = "\u{1F968}";
const bagel = "\u{1F96F}";
const pancakes = "\u{1F95E}";
const waffle = "\u{1F9C7}";
const cheese = "\u{1F9C0}";
const meat_on_bone = "\u{1F356}";
const poultry_leg = "\u{1F357}";
const cut_of_meat = "\u{1F969}";
const bacon = "\u{1F953}";
const hamburger = "\u{1F354}";
const fries = "\u{1F35F}";
const pizza = "\u{1F355}";
const hotdog = "\u{1F32D}";
const sandwich = "\u{1F96A}";
const taco = "\u{1F32E}";
const burrito = "\u{1F32F}";
const tamale = "\u{1FAD4}";
const stuffed_flatbread = "\u{1F959}";
const falafel = "\u{1F9C6}";
const egg = "\u{1F95A}";
const fried_egg = "\u{1F373}";
const shallow_pan_of_food = "\u{1F958}";
const stew = "\u{1F372}";
const fondue = "\u{1FAD5}";
const bowl_with_spoon = "\u{1F963}";
const green_salad = "\u{1F957}";
const popcorn = "\u{1F37F}";
const butter = "\u{1F9C8}";
const salt = "\u{1F9C2}";
const canned_food = "\u{1F96B}";
const bento = "\u{1F371}";
const rice_cracker = "\u{1F358}";
const rice_ball = "\u{1F359}";
const rice = "\u{1F35A}";
const curry = "\u{1F35B}";
const ramen = "\u{1F35C}";
const spaghetti = "\u{1F35D}";
const sweet_potato = "\u{1F360}";
const oden = "\u{1F362}";
const sushi = "\u{1F363}";
const fried_shrimp = "\u{1F364}";
const fish_cake = "\u{1F365}";
const moon_cake = "\u{1F96E}";
const dango = "\u{1F361}";
const dumpling = "\u{1F95F}";
const fortune_cookie = "\u{1F960}";
const takeout_box = "\u{1F961}";
const crab = "\u{1F980}";
const lobster = "\u{1F99E}";
const shrimp = "\u{1F990}";
const squid = "\u{1F991}";
const oyster = "\u{1F9AA}";
const icecream = "\u{1F366}";
const shaved_ice = "\u{1F367}";
const ice_cream = "\u{1F368}";
const doughnut = "\u{1F369}";
const cookie = "\u{1F36A}";
const birthday = "\u{1F382}";
const cake = "\u{1F370}";
const cupcake = "\u{1F9C1}";
const pie = "\u{1F967}";
const chocolate_bar = "\u{1F36B}";
const candy = "\u{1F36C}";
const lollipop = "\u{1F36D}";
const custard = "\u{1F36E}";
const honey_pot = "\u{1F36F}";
const baby_bottle = "\u{1F37C}";
const milk_glass = "\u{1F95B}";
const coffee = "\u2615";
const teapot = "\u{1FAD6}";
const tea = "\u{1F375}";
const sake = "\u{1F376}";
const champagne = "\u{1F37E}";
const wine_glass = "\u{1F377}";
const cocktail = "\u{1F378}";
const tropical_drink = "\u{1F379}";
const beer = "\u{1F37A}";
const beers = "\u{1F37B}";
const clinking_glasses = "\u{1F942}";
const tumbler_glass = "\u{1F943}";
const cup_with_straw = "\u{1F964}";
const bubble_tea = "\u{1F9CB}";
const beverage_box = "\u{1F9C3}";
const mate = "\u{1F9C9}";
const ice_cube = "\u{1F9CA}";
const chopsticks = "\u{1F962}";
const plate_with_cutlery = "\u{1F37D}\uFE0F";
const fork_and_knife = "\u{1F374}";
const spoon = "\u{1F944}";
const hocho = "\u{1F52A}";
const knife = "\u{1F52A}";
const amphora = "\u{1F3FA}";
const earth_africa = "\u{1F30D}";
const earth_americas = "\u{1F30E}";
const earth_asia = "\u{1F30F}";
const globe_with_meridians = "\u{1F310}";
const world_map = "\u{1F5FA}\uFE0F";
const japan = "\u{1F5FE}";
const compass = "\u{1F9ED}";
const mountain_snow = "\u{1F3D4}\uFE0F";
const mountain = "\u26F0\uFE0F";
const volcano = "\u{1F30B}";
const mount_fuji = "\u{1F5FB}";
const camping = "\u{1F3D5}\uFE0F";
const beach_umbrella = "\u{1F3D6}\uFE0F";
const desert = "\u{1F3DC}\uFE0F";
const desert_island = "\u{1F3DD}\uFE0F";
const national_park = "\u{1F3DE}\uFE0F";
const stadium = "\u{1F3DF}\uFE0F";
const classical_building = "\u{1F3DB}\uFE0F";
const building_construction = "\u{1F3D7}\uFE0F";
const bricks = "\u{1F9F1}";
const rock = "\u{1FAA8}";
const wood = "\u{1FAB5}";
const hut = "\u{1F6D6}";
const houses = "\u{1F3D8}\uFE0F";
const derelict_house = "\u{1F3DA}\uFE0F";
const house = "\u{1F3E0}";
const house_with_garden = "\u{1F3E1}";
const office = "\u{1F3E2}";
const post_office = "\u{1F3E3}";
const european_post_office = "\u{1F3E4}";
const hospital = "\u{1F3E5}";
const bank = "\u{1F3E6}";
const hotel = "\u{1F3E8}";
const love_hotel = "\u{1F3E9}";
const convenience_store = "\u{1F3EA}";
const school = "\u{1F3EB}";
const department_store = "\u{1F3EC}";
const factory = "\u{1F3ED}";
const japanese_castle = "\u{1F3EF}";
const european_castle = "\u{1F3F0}";
const wedding = "\u{1F492}";
const tokyo_tower = "\u{1F5FC}";
const statue_of_liberty = "\u{1F5FD}";
const church = "\u26EA";
const mosque = "\u{1F54C}";
const hindu_temple = "\u{1F6D5}";
const synagogue = "\u{1F54D}";
const shinto_shrine = "\u26E9\uFE0F";
const kaaba = "\u{1F54B}";
const fountain = "\u26F2";
const tent = "\u26FA";
const foggy = "\u{1F301}";
const night_with_stars = "\u{1F303}";
const cityscape = "\u{1F3D9}\uFE0F";
const sunrise_over_mountains = "\u{1F304}";
const sunrise = "\u{1F305}";
const city_sunset = "\u{1F306}";
const city_sunrise = "\u{1F307}";
const bridge_at_night = "\u{1F309}";
const hotsprings = "\u2668\uFE0F";
const carousel_horse = "\u{1F3A0}";
const ferris_wheel = "\u{1F3A1}";
const roller_coaster = "\u{1F3A2}";
const barber = "\u{1F488}";
const circus_tent = "\u{1F3AA}";
const steam_locomotive = "\u{1F682}";
const railway_car = "\u{1F683}";
const bullettrain_side = "\u{1F684}";
const bullettrain_front = "\u{1F685}";
const train2 = "\u{1F686}";
const metro = "\u{1F687}";
const light_rail = "\u{1F688}";
const station = "\u{1F689}";
const tram = "\u{1F68A}";
const monorail = "\u{1F69D}";
const mountain_railway = "\u{1F69E}";
const train = "\u{1F68B}";
const bus = "\u{1F68C}";
const oncoming_bus = "\u{1F68D}";
const trolleybus = "\u{1F68E}";
const minibus = "\u{1F690}";
const ambulance = "\u{1F691}";
const fire_engine = "\u{1F692}";
const police_car = "\u{1F693}";
const oncoming_police_car = "\u{1F694}";
const taxi = "\u{1F695}";
const oncoming_taxi = "\u{1F696}";
const car = "\u{1F697}";
const red_car = "\u{1F697}";
const oncoming_automobile = "\u{1F698}";
const blue_car = "\u{1F699}";
const pickup_truck = "\u{1F6FB}";
const truck = "\u{1F69A}";
const articulated_lorry = "\u{1F69B}";
const tractor = "\u{1F69C}";
const racing_car = "\u{1F3CE}\uFE0F";
const motorcycle = "\u{1F3CD}\uFE0F";
const motor_scooter = "\u{1F6F5}";
const manual_wheelchair = "\u{1F9BD}";
const motorized_wheelchair = "\u{1F9BC}";
const auto_rickshaw = "\u{1F6FA}";
const bike = "\u{1F6B2}";
const kick_scooter = "\u{1F6F4}";
const skateboard = "\u{1F6F9}";
const roller_skate = "\u{1F6FC}";
const busstop = "\u{1F68F}";
const motorway = "\u{1F6E3}\uFE0F";
const railway_track = "\u{1F6E4}\uFE0F";
const oil_drum = "\u{1F6E2}\uFE0F";
const fuelpump = "\u26FD";
const rotating_light = "\u{1F6A8}";
const traffic_light = "\u{1F6A5}";
const vertical_traffic_light = "\u{1F6A6}";
const stop_sign = "\u{1F6D1}";
const construction = "\u{1F6A7}";
const anchor = "\u2693";
const boat = "\u26F5";
const sailboat = "\u26F5";
const canoe = "\u{1F6F6}";
const speedboat = "\u{1F6A4}";
const passenger_ship = "\u{1F6F3}\uFE0F";
const ferry = "\u26F4\uFE0F";
const motor_boat = "\u{1F6E5}\uFE0F";
const ship = "\u{1F6A2}";
const airplane = "\u2708\uFE0F";
const small_airplane = "\u{1F6E9}\uFE0F";
const flight_departure = "\u{1F6EB}";
const flight_arrival = "\u{1F6EC}";
const parachute = "\u{1FA82}";
const seat = "\u{1F4BA}";
const helicopter = "\u{1F681}";
const suspension_railway = "\u{1F69F}";
const mountain_cableway = "\u{1F6A0}";
const aerial_tramway = "\u{1F6A1}";
const artificial_satellite = "\u{1F6F0}\uFE0F";
const rocket = "\u{1F680}";
const flying_saucer = "\u{1F6F8}";
const bellhop_bell = "\u{1F6CE}\uFE0F";
const luggage = "\u{1F9F3}";
const hourglass = "\u231B";
const hourglass_flowing_sand = "\u23F3";
const watch = "\u231A";
const alarm_clock = "\u23F0";
const stopwatch = "\u23F1\uFE0F";
const timer_clock = "\u23F2\uFE0F";
const mantelpiece_clock = "\u{1F570}\uFE0F";
const clock12 = "\u{1F55B}";
const clock1230 = "\u{1F567}";
const clock1 = "\u{1F550}";
const clock130 = "\u{1F55C}";
const clock2 = "\u{1F551}";
const clock230 = "\u{1F55D}";
const clock3 = "\u{1F552}";
const clock330 = "\u{1F55E}";
const clock4 = "\u{1F553}";
const clock430 = "\u{1F55F}";
const clock5 = "\u{1F554}";
const clock530 = "\u{1F560}";
const clock6 = "\u{1F555}";
const clock630 = "\u{1F561}";
const clock7 = "\u{1F556}";
const clock730 = "\u{1F562}";
const clock8 = "\u{1F557}";
const clock830 = "\u{1F563}";
const clock9 = "\u{1F558}";
const clock930 = "\u{1F564}";
const clock10 = "\u{1F559}";
const clock1030 = "\u{1F565}";
const clock11 = "\u{1F55A}";
const clock1130 = "\u{1F566}";
const new_moon = "\u{1F311}";
const waxing_crescent_moon = "\u{1F312}";
const first_quarter_moon = "\u{1F313}";
const moon = "\u{1F314}";
const waxing_gibbous_moon = "\u{1F314}";
const full_moon = "\u{1F315}";
const waning_gibbous_moon = "\u{1F316}";
const last_quarter_moon = "\u{1F317}";
const waning_crescent_moon = "\u{1F318}";
const crescent_moon = "\u{1F319}";
const new_moon_with_face = "\u{1F31A}";
const first_quarter_moon_with_face = "\u{1F31B}";
const last_quarter_moon_with_face = "\u{1F31C}";
const thermometer = "\u{1F321}\uFE0F";
const sunny = "\u2600\uFE0F";
const full_moon_with_face = "\u{1F31D}";
const sun_with_face = "\u{1F31E}";
const ringed_planet = "\u{1FA90}";
const star = "\u2B50";
const star2 = "\u{1F31F}";
const stars = "\u{1F320}";
const milky_way = "\u{1F30C}";
const cloud = "\u2601\uFE0F";
const partly_sunny = "\u26C5";
const cloud_with_lightning_and_rain = "\u26C8\uFE0F";
const sun_behind_small_cloud = "\u{1F324}\uFE0F";
const sun_behind_large_cloud = "\u{1F325}\uFE0F";
const sun_behind_rain_cloud = "\u{1F326}\uFE0F";
const cloud_with_rain = "\u{1F327}\uFE0F";
const cloud_with_snow = "\u{1F328}\uFE0F";
const cloud_with_lightning = "\u{1F329}\uFE0F";
const tornado = "\u{1F32A}\uFE0F";
const fog = "\u{1F32B}\uFE0F";
const wind_face = "\u{1F32C}\uFE0F";
const cyclone = "\u{1F300}";
const rainbow = "\u{1F308}";
const closed_umbrella = "\u{1F302}";
const open_umbrella = "\u2602\uFE0F";
const umbrella = "\u2614";
const parasol_on_ground = "\u26F1\uFE0F";
const zap = "\u26A1";
const snowflake = "\u2744\uFE0F";
const snowman_with_snow = "\u2603\uFE0F";
const snowman = "\u26C4";
const comet = "\u2604\uFE0F";
const fire = "\u{1F525}";
const droplet = "\u{1F4A7}";
const ocean = "\u{1F30A}";
const jack_o_lantern = "\u{1F383}";
const christmas_tree = "\u{1F384}";
const fireworks = "\u{1F386}";
const sparkler = "\u{1F387}";
const firecracker = "\u{1F9E8}";
const sparkles = "\u2728";
const balloon = "\u{1F388}";
const tada = "\u{1F389}";
const confetti_ball = "\u{1F38A}";
const tanabata_tree = "\u{1F38B}";
const bamboo = "\u{1F38D}";
const dolls = "\u{1F38E}";
const flags = "\u{1F38F}";
const wind_chime = "\u{1F390}";
const rice_scene = "\u{1F391}";
const red_envelope = "\u{1F9E7}";
const ribbon = "\u{1F380}";
const gift = "\u{1F381}";
const reminder_ribbon = "\u{1F397}\uFE0F";
const tickets = "\u{1F39F}\uFE0F";
const ticket = "\u{1F3AB}";
const medal_military = "\u{1F396}\uFE0F";
const trophy = "\u{1F3C6}";
const medal_sports = "\u{1F3C5}";
const soccer = "\u26BD";
const baseball = "\u26BE";
const softball = "\u{1F94E}";
const basketball = "\u{1F3C0}";
const volleyball = "\u{1F3D0}";
const football = "\u{1F3C8}";
const rugby_football = "\u{1F3C9}";
const tennis = "\u{1F3BE}";
const flying_disc = "\u{1F94F}";
const bowling = "\u{1F3B3}";
const cricket_game = "\u{1F3CF}";
const field_hockey = "\u{1F3D1}";
const ice_hockey = "\u{1F3D2}";
const lacrosse = "\u{1F94D}";
const ping_pong = "\u{1F3D3}";
const badminton = "\u{1F3F8}";
const boxing_glove = "\u{1F94A}";
const martial_arts_uniform = "\u{1F94B}";
const goal_net = "\u{1F945}";
const golf = "\u26F3";
const ice_skate = "\u26F8\uFE0F";
const fishing_pole_and_fish = "\u{1F3A3}";
const diving_mask = "\u{1F93F}";
const running_shirt_with_sash = "\u{1F3BD}";
const ski = "\u{1F3BF}";
const sled = "\u{1F6F7}";
const curling_stone = "\u{1F94C}";
const dart = "\u{1F3AF}";
const yo_yo = "\u{1FA80}";
const kite = "\u{1FA81}";
const crystal_ball = "\u{1F52E}";
const magic_wand = "\u{1FA84}";
const nazar_amulet = "\u{1F9FF}";
const video_game = "\u{1F3AE}";
const joystick = "\u{1F579}\uFE0F";
const slot_machine = "\u{1F3B0}";
const game_die = "\u{1F3B2}";
const jigsaw = "\u{1F9E9}";
const teddy_bear = "\u{1F9F8}";
const pinata = "\u{1FA85}";
const nesting_dolls = "\u{1FA86}";
const spades = "\u2660\uFE0F";
const hearts = "\u2665\uFE0F";
const diamonds = "\u2666\uFE0F";
const clubs = "\u2663\uFE0F";
const chess_pawn = "\u265F\uFE0F";
const black_joker = "\u{1F0CF}";
const mahjong = "\u{1F004}";
const flower_playing_cards = "\u{1F3B4}";
const performing_arts = "\u{1F3AD}";
const framed_picture = "\u{1F5BC}\uFE0F";
const art = "\u{1F3A8}";
const thread = "\u{1F9F5}";
const sewing_needle = "\u{1FAA1}";
const yarn = "\u{1F9F6}";
const knot = "\u{1FAA2}";
const eyeglasses = "\u{1F453}";
const dark_sunglasses = "\u{1F576}\uFE0F";
const goggles = "\u{1F97D}";
const lab_coat = "\u{1F97C}";
const safety_vest = "\u{1F9BA}";
const necktie = "\u{1F454}";
const shirt = "\u{1F455}";
const tshirt = "\u{1F455}";
const jeans = "\u{1F456}";
const scarf = "\u{1F9E3}";
const gloves = "\u{1F9E4}";
const coat = "\u{1F9E5}";
const socks = "\u{1F9E6}";
const dress = "\u{1F457}";
const kimono = "\u{1F458}";
const sari = "\u{1F97B}";
const one_piece_swimsuit = "\u{1FA71}";
const swim_brief = "\u{1FA72}";
const shorts = "\u{1FA73}";
const bikini = "\u{1F459}";
const womans_clothes = "\u{1F45A}";
const purse = "\u{1F45B}";
const handbag = "\u{1F45C}";
const pouch = "\u{1F45D}";
const shopping = "\u{1F6CD}\uFE0F";
const school_satchel = "\u{1F392}";
const thong_sandal = "\u{1FA74}";
const mans_shoe = "\u{1F45E}";
const shoe = "\u{1F45E}";
const athletic_shoe = "\u{1F45F}";
const hiking_boot = "\u{1F97E}";
const flat_shoe = "\u{1F97F}";
const high_heel = "\u{1F460}";
const sandal = "\u{1F461}";
const ballet_shoes = "\u{1FA70}";
const boot = "\u{1F462}";
const crown = "\u{1F451}";
const womans_hat = "\u{1F452}";
const tophat = "\u{1F3A9}";
const mortar_board = "\u{1F393}";
const billed_cap = "\u{1F9E2}";
const military_helmet = "\u{1FA96}";
const rescue_worker_helmet = "\u26D1\uFE0F";
const prayer_beads = "\u{1F4FF}";
const lipstick = "\u{1F484}";
const ring = "\u{1F48D}";
const gem = "\u{1F48E}";
const mute = "\u{1F507}";
const speaker = "\u{1F508}";
const sound = "\u{1F509}";
const loud_sound = "\u{1F50A}";
const loudspeaker = "\u{1F4E2}";
const mega = "\u{1F4E3}";
const postal_horn = "\u{1F4EF}";
const bell = "\u{1F514}";
const no_bell = "\u{1F515}";
const musical_score = "\u{1F3BC}";
const musical_note = "\u{1F3B5}";
const notes = "\u{1F3B6}";
const studio_microphone = "\u{1F399}\uFE0F";
const level_slider = "\u{1F39A}\uFE0F";
const control_knobs = "\u{1F39B}\uFE0F";
const microphone = "\u{1F3A4}";
const headphones = "\u{1F3A7}";
const radio = "\u{1F4FB}";
const saxophone = "\u{1F3B7}";
const accordion = "\u{1FA97}";
const guitar = "\u{1F3B8}";
const musical_keyboard = "\u{1F3B9}";
const trumpet = "\u{1F3BA}";
const violin = "\u{1F3BB}";
const banjo = "\u{1FA95}";
const drum = "\u{1F941}";
const long_drum = "\u{1FA98}";
const iphone = "\u{1F4F1}";
const calling = "\u{1F4F2}";
const phone = "\u260E\uFE0F";
const telephone = "\u260E\uFE0F";
const telephone_receiver = "\u{1F4DE}";
const pager = "\u{1F4DF}";
const fax = "\u{1F4E0}";
const battery = "\u{1F50B}";
const electric_plug = "\u{1F50C}";
const computer = "\u{1F4BB}";
const desktop_computer = "\u{1F5A5}\uFE0F";
const printer = "\u{1F5A8}\uFE0F";
const keyboard = "\u2328\uFE0F";
const computer_mouse = "\u{1F5B1}\uFE0F";
const trackball = "\u{1F5B2}\uFE0F";
const minidisc = "\u{1F4BD}";
const floppy_disk = "\u{1F4BE}";
const cd = "\u{1F4BF}";
const dvd = "\u{1F4C0}";
const abacus = "\u{1F9EE}";
const movie_camera = "\u{1F3A5}";
const film_strip = "\u{1F39E}\uFE0F";
const film_projector = "\u{1F4FD}\uFE0F";
const clapper = "\u{1F3AC}";
const tv = "\u{1F4FA}";
const camera = "\u{1F4F7}";
const camera_flash = "\u{1F4F8}";
const video_camera = "\u{1F4F9}";
const vhs = "\u{1F4FC}";
const mag = "\u{1F50D}";
const mag_right = "\u{1F50E}";
const candle = "\u{1F56F}\uFE0F";
const bulb = "\u{1F4A1}";
const flashlight = "\u{1F526}";
const izakaya_lantern = "\u{1F3EE}";
const lantern = "\u{1F3EE}";
const diya_lamp = "\u{1FA94}";
const notebook_with_decorative_cover = "\u{1F4D4}";
const closed_book = "\u{1F4D5}";
const book = "\u{1F4D6}";
const open_book = "\u{1F4D6}";
const green_book = "\u{1F4D7}";
const blue_book = "\u{1F4D8}";
const orange_book = "\u{1F4D9}";
const books = "\u{1F4DA}";
const notebook = "\u{1F4D3}";
const ledger = "\u{1F4D2}";
const page_with_curl = "\u{1F4C3}";
const scroll = "\u{1F4DC}";
const page_facing_up = "\u{1F4C4}";
const newspaper = "\u{1F4F0}";
const newspaper_roll = "\u{1F5DE}\uFE0F";
const bookmark_tabs = "\u{1F4D1}";
const bookmark = "\u{1F516}";
const label = "\u{1F3F7}\uFE0F";
const moneybag = "\u{1F4B0}";
const coin = "\u{1FA99}";
const yen = "\u{1F4B4}";
const dollar = "\u{1F4B5}";
const euro = "\u{1F4B6}";
const pound = "\u{1F4B7}";
const money_with_wings = "\u{1F4B8}";
const credit_card = "\u{1F4B3}";
const receipt = "\u{1F9FE}";
const chart = "\u{1F4B9}";
const envelope = "\u2709\uFE0F";
const email = "\u{1F4E7}";
const incoming_envelope = "\u{1F4E8}";
const envelope_with_arrow = "\u{1F4E9}";
const outbox_tray = "\u{1F4E4}";
const inbox_tray = "\u{1F4E5}";
const mailbox = "\u{1F4EB}";
const mailbox_closed = "\u{1F4EA}";
const mailbox_with_mail = "\u{1F4EC}";
const mailbox_with_no_mail = "\u{1F4ED}";
const postbox = "\u{1F4EE}";
const ballot_box = "\u{1F5F3}\uFE0F";
const pencil2 = "\u270F\uFE0F";
const black_nib = "\u2712\uFE0F";
const fountain_pen = "\u{1F58B}\uFE0F";
const pen = "\u{1F58A}\uFE0F";
const paintbrush = "\u{1F58C}\uFE0F";
const crayon = "\u{1F58D}\uFE0F";
const memo = "\u{1F4DD}";
const pencil = "\u{1F4DD}";
const briefcase = "\u{1F4BC}";
const file_folder = "\u{1F4C1}";
const open_file_folder = "\u{1F4C2}";
const card_index_dividers = "\u{1F5C2}\uFE0F";
const date = "\u{1F4C5}";
const calendar = "\u{1F4C6}";
const spiral_notepad = "\u{1F5D2}\uFE0F";
const spiral_calendar = "\u{1F5D3}\uFE0F";
const card_index = "\u{1F4C7}";
const chart_with_upwards_trend = "\u{1F4C8}";
const chart_with_downwards_trend = "\u{1F4C9}";
const bar_chart = "\u{1F4CA}";
const clipboard = "\u{1F4CB}";
const pushpin = "\u{1F4CC}";
const round_pushpin = "\u{1F4CD}";
const paperclip = "\u{1F4CE}";
const paperclips = "\u{1F587}\uFE0F";
const straight_ruler = "\u{1F4CF}";
const triangular_ruler = "\u{1F4D0}";
const scissors = "\u2702\uFE0F";
const card_file_box = "\u{1F5C3}\uFE0F";
const file_cabinet = "\u{1F5C4}\uFE0F";
const wastebasket = "\u{1F5D1}\uFE0F";
const lock = "\u{1F512}";
const unlock = "\u{1F513}";
const lock_with_ink_pen = "\u{1F50F}";
const closed_lock_with_key = "\u{1F510}";
const key = "\u{1F511}";
const old_key = "\u{1F5DD}\uFE0F";
const hammer = "\u{1F528}";
const axe = "\u{1FA93}";
const pick = "\u26CF\uFE0F";
const hammer_and_pick = "\u2692\uFE0F";
const hammer_and_wrench = "\u{1F6E0}\uFE0F";
const dagger = "\u{1F5E1}\uFE0F";
const crossed_swords = "\u2694\uFE0F";
const gun = "\u{1F52B}";
const boomerang = "\u{1FA83}";
const bow_and_arrow = "\u{1F3F9}";
const shield = "\u{1F6E1}\uFE0F";
const carpentry_saw = "\u{1FA9A}";
const wrench = "\u{1F527}";
const screwdriver = "\u{1FA9B}";
const nut_and_bolt = "\u{1F529}";
const gear = "\u2699\uFE0F";
const clamp = "\u{1F5DC}\uFE0F";
const balance_scale = "\u2696\uFE0F";
const probing_cane = "\u{1F9AF}";
const link = "\u{1F517}";
const chains = "\u26D3\uFE0F";
const hook = "\u{1FA9D}";
const toolbox = "\u{1F9F0}";
const magnet = "\u{1F9F2}";
const ladder = "\u{1FA9C}";
const alembic = "\u2697\uFE0F";
const test_tube = "\u{1F9EA}";
const petri_dish = "\u{1F9EB}";
const dna = "\u{1F9EC}";
const microscope = "\u{1F52C}";
const telescope = "\u{1F52D}";
const satellite = "\u{1F4E1}";
const syringe = "\u{1F489}";
const drop_of_blood = "\u{1FA78}";
const pill = "\u{1F48A}";
const adhesive_bandage = "\u{1FA79}";
const stethoscope = "\u{1FA7A}";
const door = "\u{1F6AA}";
const elevator = "\u{1F6D7}";
const mirror = "\u{1FA9E}";
const window$1 = "\u{1FA9F}";
const bed = "\u{1F6CF}\uFE0F";
const couch_and_lamp = "\u{1F6CB}\uFE0F";
const chair = "\u{1FA91}";
const toilet = "\u{1F6BD}";
const plunger = "\u{1FAA0}";
const shower = "\u{1F6BF}";
const bathtub = "\u{1F6C1}";
const mouse_trap = "\u{1FAA4}";
const razor = "\u{1FA92}";
const lotion_bottle = "\u{1F9F4}";
const safety_pin = "\u{1F9F7}";
const broom = "\u{1F9F9}";
const basket = "\u{1F9FA}";
const roll_of_paper = "\u{1F9FB}";
const bucket = "\u{1FAA3}";
const soap = "\u{1F9FC}";
const toothbrush = "\u{1FAA5}";
const sponge = "\u{1F9FD}";
const fire_extinguisher = "\u{1F9EF}";
const shopping_cart = "\u{1F6D2}";
const smoking = "\u{1F6AC}";
const coffin = "\u26B0\uFE0F";
const headstone = "\u{1FAA6}";
const funeral_urn = "\u26B1\uFE0F";
const moyai = "\u{1F5FF}";
const placard = "\u{1FAA7}";
const atm = "\u{1F3E7}";
const put_litter_in_its_place = "\u{1F6AE}";
const potable_water = "\u{1F6B0}";
const wheelchair = "\u267F";
const mens = "\u{1F6B9}";
const womens = "\u{1F6BA}";
const restroom = "\u{1F6BB}";
const baby_symbol = "\u{1F6BC}";
const wc = "\u{1F6BE}";
const passport_control = "\u{1F6C2}";
const customs = "\u{1F6C3}";
const baggage_claim = "\u{1F6C4}";
const left_luggage = "\u{1F6C5}";
const warning = "\u26A0\uFE0F";
const children_crossing = "\u{1F6B8}";
const no_entry = "\u26D4";
const no_entry_sign = "\u{1F6AB}";
const no_bicycles = "\u{1F6B3}";
const no_smoking = "\u{1F6AD}";
const do_not_litter = "\u{1F6AF}";
const no_pedestrians = "\u{1F6B7}";
const no_mobile_phones = "\u{1F4F5}";
const underage = "\u{1F51E}";
const radioactive = "\u2622\uFE0F";
const biohazard = "\u2623\uFE0F";
const arrow_up = "\u2B06\uFE0F";
const arrow_upper_right = "\u2197\uFE0F";
const arrow_right = "\u27A1\uFE0F";
const arrow_lower_right = "\u2198\uFE0F";
const arrow_down = "\u2B07\uFE0F";
const arrow_lower_left = "\u2199\uFE0F";
const arrow_left = "\u2B05\uFE0F";
const arrow_upper_left = "\u2196\uFE0F";
const arrow_up_down = "\u2195\uFE0F";
const left_right_arrow = "\u2194\uFE0F";
const leftwards_arrow_with_hook = "\u21A9\uFE0F";
const arrow_right_hook = "\u21AA\uFE0F";
const arrow_heading_up = "\u2934\uFE0F";
const arrow_heading_down = "\u2935\uFE0F";
const arrows_clockwise = "\u{1F503}";
const arrows_counterclockwise = "\u{1F504}";
const back = "\u{1F519}";
const end = "\u{1F51A}";
const on = "\u{1F51B}";
const soon = "\u{1F51C}";
const top = "\u{1F51D}";
const place_of_worship = "\u{1F6D0}";
const atom_symbol = "\u269B\uFE0F";
const om = "\u{1F549}\uFE0F";
const star_of_david = "\u2721\uFE0F";
const wheel_of_dharma = "\u2638\uFE0F";
const yin_yang = "\u262F\uFE0F";
const latin_cross = "\u271D\uFE0F";
const orthodox_cross = "\u2626\uFE0F";
const star_and_crescent = "\u262A\uFE0F";
const peace_symbol = "\u262E\uFE0F";
const menorah = "\u{1F54E}";
const six_pointed_star = "\u{1F52F}";
const aries = "\u2648";
const taurus = "\u2649";
const gemini = "\u264A";
const cancer = "\u264B";
const leo = "\u264C";
const virgo = "\u264D";
const libra = "\u264E";
const scorpius = "\u264F";
const sagittarius = "\u2650";
const capricorn = "\u2651";
const aquarius = "\u2652";
const pisces = "\u2653";
const ophiuchus = "\u26CE";
const twisted_rightwards_arrows = "\u{1F500}";
const repeat = "\u{1F501}";
const repeat_one = "\u{1F502}";
const arrow_forward = "\u25B6\uFE0F";
const fast_forward = "\u23E9";
const next_track_button = "\u23ED\uFE0F";
const play_or_pause_button = "\u23EF\uFE0F";
const arrow_backward = "\u25C0\uFE0F";
const rewind = "\u23EA";
const previous_track_button = "\u23EE\uFE0F";
const arrow_up_small = "\u{1F53C}";
const arrow_double_up = "\u23EB";
const arrow_down_small = "\u{1F53D}";
const arrow_double_down = "\u23EC";
const pause_button = "\u23F8\uFE0F";
const stop_button = "\u23F9\uFE0F";
const record_button = "\u23FA\uFE0F";
const eject_button = "\u23CF\uFE0F";
const cinema = "\u{1F3A6}";
const low_brightness = "\u{1F505}";
const high_brightness = "\u{1F506}";
const signal_strength = "\u{1F4F6}";
const vibration_mode = "\u{1F4F3}";
const mobile_phone_off = "\u{1F4F4}";
const female_sign = "\u2640\uFE0F";
const male_sign = "\u2642\uFE0F";
const transgender_symbol = "\u26A7\uFE0F";
const heavy_multiplication_x = "\u2716\uFE0F";
const heavy_plus_sign = "\u2795";
const heavy_minus_sign = "\u2796";
const heavy_division_sign = "\u2797";
const infinity = "\u267E\uFE0F";
const bangbang = "\u203C\uFE0F";
const interrobang = "\u2049\uFE0F";
const question = "\u2753";
const grey_question = "\u2754";
const grey_exclamation = "\u2755";
const exclamation = "\u2757";
const heavy_exclamation_mark = "\u2757";
const wavy_dash = "\u3030\uFE0F";
const currency_exchange = "\u{1F4B1}";
const heavy_dollar_sign = "\u{1F4B2}";
const medical_symbol = "\u2695\uFE0F";
const recycle = "\u267B\uFE0F";
const fleur_de_lis = "\u269C\uFE0F";
const trident = "\u{1F531}";
const name_badge = "\u{1F4DB}";
const beginner = "\u{1F530}";
const o$1 = "\u2B55";
const white_check_mark = "\u2705";
const ballot_box_with_check = "\u2611\uFE0F";
const heavy_check_mark = "\u2714\uFE0F";
const x = "\u274C";
const negative_squared_cross_mark = "\u274E";
const curly_loop = "\u27B0";
const loop = "\u27BF";
const part_alternation_mark = "\u303D\uFE0F";
const eight_spoked_asterisk = "\u2733\uFE0F";
const eight_pointed_black_star = "\u2734\uFE0F";
const sparkle = "\u2747\uFE0F";
const copyright = "\xA9\uFE0F";
const registered = "\xAE\uFE0F";
const tm = "\u2122\uFE0F";
const hash = "#\uFE0F\u20E3";
const asterisk = "*\uFE0F\u20E3";
const zero = "0\uFE0F\u20E3";
const one = "1\uFE0F\u20E3";
const two = "2\uFE0F\u20E3";
const three = "3\uFE0F\u20E3";
const four = "4\uFE0F\u20E3";
const five = "5\uFE0F\u20E3";
const six = "6\uFE0F\u20E3";
const seven = "7\uFE0F\u20E3";
const eight = "8\uFE0F\u20E3";
const nine = "9\uFE0F\u20E3";
const keycap_ten = "\u{1F51F}";
const capital_abcd = "\u{1F520}";
const abcd = "\u{1F521}";
const symbols = "\u{1F523}";
const abc = "\u{1F524}";
const a$1 = "\u{1F170}\uFE0F";
const ab = "\u{1F18E}";
const b$1 = "\u{1F171}\uFE0F";
const cl = "\u{1F191}";
const cool = "\u{1F192}";
const free = "\u{1F193}";
const information_source = "\u2139\uFE0F";
const id$1 = "\u{1F194}";
const m = "\u24C2\uFE0F";
const ng = "\u{1F196}";
const o2 = "\u{1F17E}\uFE0F";
const ok = "\u{1F197}";
const parking = "\u{1F17F}\uFE0F";
const sos = "\u{1F198}";
const up = "\u{1F199}";
const vs = "\u{1F19A}";
const koko = "\u{1F201}";
const sa = "\u{1F202}\uFE0F";
const ideograph_advantage = "\u{1F250}";
const accept = "\u{1F251}";
const congratulations = "\u3297\uFE0F";
const secret = "\u3299\uFE0F";
const u6e80 = "\u{1F235}";
const red_circle = "\u{1F534}";
const orange_circle = "\u{1F7E0}";
const yellow_circle = "\u{1F7E1}";
const green_circle = "\u{1F7E2}";
const large_blue_circle = "\u{1F535}";
const purple_circle = "\u{1F7E3}";
const brown_circle = "\u{1F7E4}";
const black_circle = "\u26AB";
const white_circle = "\u26AA";
const red_square = "\u{1F7E5}";
const orange_square = "\u{1F7E7}";
const yellow_square = "\u{1F7E8}";
const green_square = "\u{1F7E9}";
const blue_square = "\u{1F7E6}";
const purple_square = "\u{1F7EA}";
const brown_square = "\u{1F7EB}";
const black_large_square = "\u2B1B";
const white_large_square = "\u2B1C";
const black_medium_square = "\u25FC\uFE0F";
const white_medium_square = "\u25FB\uFE0F";
const black_medium_small_square = "\u25FE";
const white_medium_small_square = "\u25FD";
const black_small_square = "\u25AA\uFE0F";
const white_small_square = "\u25AB\uFE0F";
const large_orange_diamond = "\u{1F536}";
const large_blue_diamond = "\u{1F537}";
const small_orange_diamond = "\u{1F538}";
const small_blue_diamond = "\u{1F539}";
const small_red_triangle = "\u{1F53A}";
const small_red_triangle_down = "\u{1F53B}";
const diamond_shape_with_a_dot_inside = "\u{1F4A0}";
const radio_button = "\u{1F518}";
const white_square_button = "\u{1F533}";
const black_square_button = "\u{1F532}";
const checkered_flag = "\u{1F3C1}";
const triangular_flag_on_post = "\u{1F6A9}";
const crossed_flags = "\u{1F38C}";
const black_flag = "\u{1F3F4}";
const white_flag = "\u{1F3F3}\uFE0F";
const rainbow_flag = "\u{1F3F3}\uFE0F\u200D\u{1F308}";
const transgender_flag = "\u{1F3F3}\uFE0F\u200D\u26A7\uFE0F";
const pirate_flag = "\u{1F3F4}\u200D\u2620\uFE0F";
const ascension_island = "\u{1F1E6}\u{1F1E8}";
const andorra = "\u{1F1E6}\u{1F1E9}";
const united_arab_emirates = "\u{1F1E6}\u{1F1EA}";
const afghanistan = "\u{1F1E6}\u{1F1EB}";
const antigua_barbuda = "\u{1F1E6}\u{1F1EC}";
const anguilla = "\u{1F1E6}\u{1F1EE}";
const albania = "\u{1F1E6}\u{1F1F1}";
const armenia = "\u{1F1E6}\u{1F1F2}";
const angola = "\u{1F1E6}\u{1F1F4}";
const antarctica = "\u{1F1E6}\u{1F1F6}";
const argentina = "\u{1F1E6}\u{1F1F7}";
const american_samoa = "\u{1F1E6}\u{1F1F8}";
const austria = "\u{1F1E6}\u{1F1F9}";
const australia = "\u{1F1E6}\u{1F1FA}";
const aruba = "\u{1F1E6}\u{1F1FC}";
const aland_islands = "\u{1F1E6}\u{1F1FD}";
const azerbaijan = "\u{1F1E6}\u{1F1FF}";
const bosnia_herzegovina = "\u{1F1E7}\u{1F1E6}";
const barbados = "\u{1F1E7}\u{1F1E7}";
const bangladesh = "\u{1F1E7}\u{1F1E9}";
const belgium = "\u{1F1E7}\u{1F1EA}";
const burkina_faso = "\u{1F1E7}\u{1F1EB}";
const bulgaria = "\u{1F1E7}\u{1F1EC}";
const bahrain = "\u{1F1E7}\u{1F1ED}";
const burundi = "\u{1F1E7}\u{1F1EE}";
const benin = "\u{1F1E7}\u{1F1EF}";
const st_barthelemy = "\u{1F1E7}\u{1F1F1}";
const bermuda = "\u{1F1E7}\u{1F1F2}";
const brunei = "\u{1F1E7}\u{1F1F3}";
const bolivia = "\u{1F1E7}\u{1F1F4}";
const caribbean_netherlands = "\u{1F1E7}\u{1F1F6}";
const brazil = "\u{1F1E7}\u{1F1F7}";
const bahamas = "\u{1F1E7}\u{1F1F8}";
const bhutan = "\u{1F1E7}\u{1F1F9}";
const bouvet_island = "\u{1F1E7}\u{1F1FB}";
const botswana = "\u{1F1E7}\u{1F1FC}";
const belarus = "\u{1F1E7}\u{1F1FE}";
const belize = "\u{1F1E7}\u{1F1FF}";
const canada = "\u{1F1E8}\u{1F1E6}";
const cocos_islands = "\u{1F1E8}\u{1F1E8}";
const congo_kinshasa = "\u{1F1E8}\u{1F1E9}";
const central_african_republic = "\u{1F1E8}\u{1F1EB}";
const congo_brazzaville = "\u{1F1E8}\u{1F1EC}";
const switzerland = "\u{1F1E8}\u{1F1ED}";
const cote_divoire = "\u{1F1E8}\u{1F1EE}";
const cook_islands = "\u{1F1E8}\u{1F1F0}";
const chile = "\u{1F1E8}\u{1F1F1}";
const cameroon = "\u{1F1E8}\u{1F1F2}";
const cn = "\u{1F1E8}\u{1F1F3}";
const colombia = "\u{1F1E8}\u{1F1F4}";
const clipperton_island = "\u{1F1E8}\u{1F1F5}";
const costa_rica = "\u{1F1E8}\u{1F1F7}";
const cuba = "\u{1F1E8}\u{1F1FA}";
const cape_verde = "\u{1F1E8}\u{1F1FB}";
const curacao = "\u{1F1E8}\u{1F1FC}";
const christmas_island = "\u{1F1E8}\u{1F1FD}";
const cyprus = "\u{1F1E8}\u{1F1FE}";
const czech_republic = "\u{1F1E8}\u{1F1FF}";
const de = "\u{1F1E9}\u{1F1EA}";
const diego_garcia = "\u{1F1E9}\u{1F1EC}";
const djibouti = "\u{1F1E9}\u{1F1EF}";
const denmark = "\u{1F1E9}\u{1F1F0}";
const dominica = "\u{1F1E9}\u{1F1F2}";
const dominican_republic = "\u{1F1E9}\u{1F1F4}";
const algeria = "\u{1F1E9}\u{1F1FF}";
const ceuta_melilla = "\u{1F1EA}\u{1F1E6}";
const ecuador = "\u{1F1EA}\u{1F1E8}";
const estonia = "\u{1F1EA}\u{1F1EA}";
const egypt = "\u{1F1EA}\u{1F1EC}";
const western_sahara = "\u{1F1EA}\u{1F1ED}";
const eritrea = "\u{1F1EA}\u{1F1F7}";
const es = "\u{1F1EA}\u{1F1F8}";
const ethiopia = "\u{1F1EA}\u{1F1F9}";
const eu = "\u{1F1EA}\u{1F1FA}";
const european_union = "\u{1F1EA}\u{1F1FA}";
const finland = "\u{1F1EB}\u{1F1EE}";
const fiji = "\u{1F1EB}\u{1F1EF}";
const falkland_islands = "\u{1F1EB}\u{1F1F0}";
const micronesia = "\u{1F1EB}\u{1F1F2}";
const faroe_islands = "\u{1F1EB}\u{1F1F4}";
const fr = "\u{1F1EB}\u{1F1F7}";
const gabon = "\u{1F1EC}\u{1F1E6}";
const gb = "\u{1F1EC}\u{1F1E7}";
const uk = "\u{1F1EC}\u{1F1E7}";
const grenada = "\u{1F1EC}\u{1F1E9}";
const georgia = "\u{1F1EC}\u{1F1EA}";
const french_guiana = "\u{1F1EC}\u{1F1EB}";
const guernsey = "\u{1F1EC}\u{1F1EC}";
const ghana = "\u{1F1EC}\u{1F1ED}";
const gibraltar = "\u{1F1EC}\u{1F1EE}";
const greenland = "\u{1F1EC}\u{1F1F1}";
const gambia = "\u{1F1EC}\u{1F1F2}";
const guinea = "\u{1F1EC}\u{1F1F3}";
const guadeloupe = "\u{1F1EC}\u{1F1F5}";
const equatorial_guinea = "\u{1F1EC}\u{1F1F6}";
const greece = "\u{1F1EC}\u{1F1F7}";
const south_georgia_south_sandwich_islands = "\u{1F1EC}\u{1F1F8}";
const guatemala = "\u{1F1EC}\u{1F1F9}";
const guam = "\u{1F1EC}\u{1F1FA}";
const guinea_bissau = "\u{1F1EC}\u{1F1FC}";
const guyana = "\u{1F1EC}\u{1F1FE}";
const hong_kong = "\u{1F1ED}\u{1F1F0}";
const heard_mcdonald_islands = "\u{1F1ED}\u{1F1F2}";
const honduras = "\u{1F1ED}\u{1F1F3}";
const croatia = "\u{1F1ED}\u{1F1F7}";
const haiti = "\u{1F1ED}\u{1F1F9}";
const hungary = "\u{1F1ED}\u{1F1FA}";
const canary_islands = "\u{1F1EE}\u{1F1E8}";
const indonesia = "\u{1F1EE}\u{1F1E9}";
const ireland = "\u{1F1EE}\u{1F1EA}";
const israel = "\u{1F1EE}\u{1F1F1}";
const isle_of_man = "\u{1F1EE}\u{1F1F2}";
const india = "\u{1F1EE}\u{1F1F3}";
const british_indian_ocean_territory = "\u{1F1EE}\u{1F1F4}";
const iraq = "\u{1F1EE}\u{1F1F6}";
const iran = "\u{1F1EE}\u{1F1F7}";
const iceland = "\u{1F1EE}\u{1F1F8}";
const it = "\u{1F1EE}\u{1F1F9}";
const jersey = "\u{1F1EF}\u{1F1EA}";
const jamaica = "\u{1F1EF}\u{1F1F2}";
const jordan = "\u{1F1EF}\u{1F1F4}";
const jp = "\u{1F1EF}\u{1F1F5}";
const kenya = "\u{1F1F0}\u{1F1EA}";
const kyrgyzstan = "\u{1F1F0}\u{1F1EC}";
const cambodia = "\u{1F1F0}\u{1F1ED}";
const kiribati = "\u{1F1F0}\u{1F1EE}";
const comoros = "\u{1F1F0}\u{1F1F2}";
const st_kitts_nevis = "\u{1F1F0}\u{1F1F3}";
const north_korea = "\u{1F1F0}\u{1F1F5}";
const kr = "\u{1F1F0}\u{1F1F7}";
const kuwait = "\u{1F1F0}\u{1F1FC}";
const cayman_islands = "\u{1F1F0}\u{1F1FE}";
const kazakhstan = "\u{1F1F0}\u{1F1FF}";
const laos = "\u{1F1F1}\u{1F1E6}";
const lebanon = "\u{1F1F1}\u{1F1E7}";
const st_lucia = "\u{1F1F1}\u{1F1E8}";
const liechtenstein = "\u{1F1F1}\u{1F1EE}";
const sri_lanka = "\u{1F1F1}\u{1F1F0}";
const liberia = "\u{1F1F1}\u{1F1F7}";
const lesotho = "\u{1F1F1}\u{1F1F8}";
const lithuania = "\u{1F1F1}\u{1F1F9}";
const luxembourg = "\u{1F1F1}\u{1F1FA}";
const latvia = "\u{1F1F1}\u{1F1FB}";
const libya = "\u{1F1F1}\u{1F1FE}";
const morocco = "\u{1F1F2}\u{1F1E6}";
const monaco = "\u{1F1F2}\u{1F1E8}";
const moldova = "\u{1F1F2}\u{1F1E9}";
const montenegro = "\u{1F1F2}\u{1F1EA}";
const st_martin = "\u{1F1F2}\u{1F1EB}";
const madagascar = "\u{1F1F2}\u{1F1EC}";
const marshall_islands = "\u{1F1F2}\u{1F1ED}";
const macedonia = "\u{1F1F2}\u{1F1F0}";
const mali = "\u{1F1F2}\u{1F1F1}";
const myanmar = "\u{1F1F2}\u{1F1F2}";
const mongolia = "\u{1F1F2}\u{1F1F3}";
const macau = "\u{1F1F2}\u{1F1F4}";
const northern_mariana_islands = "\u{1F1F2}\u{1F1F5}";
const martinique = "\u{1F1F2}\u{1F1F6}";
const mauritania = "\u{1F1F2}\u{1F1F7}";
const montserrat = "\u{1F1F2}\u{1F1F8}";
const malta = "\u{1F1F2}\u{1F1F9}";
const mauritius = "\u{1F1F2}\u{1F1FA}";
const maldives = "\u{1F1F2}\u{1F1FB}";
const malawi = "\u{1F1F2}\u{1F1FC}";
const mexico = "\u{1F1F2}\u{1F1FD}";
const malaysia = "\u{1F1F2}\u{1F1FE}";
const mozambique = "\u{1F1F2}\u{1F1FF}";
const namibia = "\u{1F1F3}\u{1F1E6}";
const new_caledonia = "\u{1F1F3}\u{1F1E8}";
const niger = "\u{1F1F3}\u{1F1EA}";
const norfolk_island = "\u{1F1F3}\u{1F1EB}";
const nigeria = "\u{1F1F3}\u{1F1EC}";
const nicaragua = "\u{1F1F3}\u{1F1EE}";
const netherlands = "\u{1F1F3}\u{1F1F1}";
const norway = "\u{1F1F3}\u{1F1F4}";
const nepal = "\u{1F1F3}\u{1F1F5}";
const nauru = "\u{1F1F3}\u{1F1F7}";
const niue = "\u{1F1F3}\u{1F1FA}";
const new_zealand = "\u{1F1F3}\u{1F1FF}";
const oman = "\u{1F1F4}\u{1F1F2}";
const panama = "\u{1F1F5}\u{1F1E6}";
const peru = "\u{1F1F5}\u{1F1EA}";
const french_polynesia = "\u{1F1F5}\u{1F1EB}";
const papua_new_guinea = "\u{1F1F5}\u{1F1EC}";
const philippines = "\u{1F1F5}\u{1F1ED}";
const pakistan = "\u{1F1F5}\u{1F1F0}";
const poland = "\u{1F1F5}\u{1F1F1}";
const st_pierre_miquelon = "\u{1F1F5}\u{1F1F2}";
const pitcairn_islands = "\u{1F1F5}\u{1F1F3}";
const puerto_rico = "\u{1F1F5}\u{1F1F7}";
const palestinian_territories = "\u{1F1F5}\u{1F1F8}";
const portugal = "\u{1F1F5}\u{1F1F9}";
const palau = "\u{1F1F5}\u{1F1FC}";
const paraguay = "\u{1F1F5}\u{1F1FE}";
const qatar = "\u{1F1F6}\u{1F1E6}";
const reunion = "\u{1F1F7}\u{1F1EA}";
const romania = "\u{1F1F7}\u{1F1F4}";
const serbia = "\u{1F1F7}\u{1F1F8}";
const ru = "\u{1F1F7}\u{1F1FA}";
const rwanda = "\u{1F1F7}\u{1F1FC}";
const saudi_arabia = "\u{1F1F8}\u{1F1E6}";
const solomon_islands = "\u{1F1F8}\u{1F1E7}";
const seychelles = "\u{1F1F8}\u{1F1E8}";
const sudan = "\u{1F1F8}\u{1F1E9}";
const sweden = "\u{1F1F8}\u{1F1EA}";
const singapore = "\u{1F1F8}\u{1F1EC}";
const st_helena = "\u{1F1F8}\u{1F1ED}";
const slovenia = "\u{1F1F8}\u{1F1EE}";
const svalbard_jan_mayen = "\u{1F1F8}\u{1F1EF}";
const slovakia = "\u{1F1F8}\u{1F1F0}";
const sierra_leone = "\u{1F1F8}\u{1F1F1}";
const san_marino = "\u{1F1F8}\u{1F1F2}";
const senegal = "\u{1F1F8}\u{1F1F3}";
const somalia = "\u{1F1F8}\u{1F1F4}";
const suriname = "\u{1F1F8}\u{1F1F7}";
const south_sudan = "\u{1F1F8}\u{1F1F8}";
const sao_tome_principe = "\u{1F1F8}\u{1F1F9}";
const el_salvador = "\u{1F1F8}\u{1F1FB}";
const sint_maarten = "\u{1F1F8}\u{1F1FD}";
const syria = "\u{1F1F8}\u{1F1FE}";
const swaziland = "\u{1F1F8}\u{1F1FF}";
const tristan_da_cunha = "\u{1F1F9}\u{1F1E6}";
const turks_caicos_islands = "\u{1F1F9}\u{1F1E8}";
const chad = "\u{1F1F9}\u{1F1E9}";
const french_southern_territories = "\u{1F1F9}\u{1F1EB}";
const togo = "\u{1F1F9}\u{1F1EC}";
const thailand = "\u{1F1F9}\u{1F1ED}";
const tajikistan = "\u{1F1F9}\u{1F1EF}";
const tokelau = "\u{1F1F9}\u{1F1F0}";
const timor_leste = "\u{1F1F9}\u{1F1F1}";
const turkmenistan = "\u{1F1F9}\u{1F1F2}";
const tunisia = "\u{1F1F9}\u{1F1F3}";
const tonga = "\u{1F1F9}\u{1F1F4}";
const tr = "\u{1F1F9}\u{1F1F7}";
const trinidad_tobago = "\u{1F1F9}\u{1F1F9}";
const tuvalu = "\u{1F1F9}\u{1F1FB}";
const taiwan = "\u{1F1F9}\u{1F1FC}";
const tanzania = "\u{1F1F9}\u{1F1FF}";
const ukraine = "\u{1F1FA}\u{1F1E6}";
const uganda = "\u{1F1FA}\u{1F1EC}";
const us_outlying_islands = "\u{1F1FA}\u{1F1F2}";
const united_nations = "\u{1F1FA}\u{1F1F3}";
const us = "\u{1F1FA}\u{1F1F8}";
const uruguay = "\u{1F1FA}\u{1F1FE}";
const uzbekistan = "\u{1F1FA}\u{1F1FF}";
const vatican_city = "\u{1F1FB}\u{1F1E6}";
const st_vincent_grenadines = "\u{1F1FB}\u{1F1E8}";
const venezuela = "\u{1F1FB}\u{1F1EA}";
const british_virgin_islands = "\u{1F1FB}\u{1F1EC}";
const us_virgin_islands = "\u{1F1FB}\u{1F1EE}";
const vietnam = "\u{1F1FB}\u{1F1F3}";
const vanuatu = "\u{1F1FB}\u{1F1FA}";
const wallis_futuna = "\u{1F1FC}\u{1F1EB}";
const samoa = "\u{1F1FC}\u{1F1F8}";
const kosovo = "\u{1F1FD}\u{1F1F0}";
const yemen = "\u{1F1FE}\u{1F1EA}";
const mayotte = "\u{1F1FE}\u{1F1F9}";
const south_africa = "\u{1F1FF}\u{1F1E6}";
const zambia = "\u{1F1FF}\u{1F1F2}";
const zimbabwe = "\u{1F1FF}\u{1F1FC}";
const england = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}";
const scotland = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}";
const wales = "\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}";
var require$$0 = {
  "100": "\u{1F4AF}",
  "1234": "\u{1F522}",
  grinning,
  smiley,
  smile,
  grin,
  laughing,
  satisfied,
  sweat_smile,
  rofl,
  joy,
  slightly_smiling_face,
  upside_down_face,
  wink,
  blush,
  innocent,
  smiling_face_with_three_hearts,
  heart_eyes,
  star_struck,
  kissing_heart,
  kissing,
  relaxed,
  kissing_closed_eyes,
  kissing_smiling_eyes,
  smiling_face_with_tear,
  yum,
  stuck_out_tongue,
  stuck_out_tongue_winking_eye,
  zany_face,
  stuck_out_tongue_closed_eyes,
  money_mouth_face,
  hugs,
  hand_over_mouth,
  shushing_face,
  thinking,
  zipper_mouth_face,
  raised_eyebrow,
  neutral_face,
  expressionless,
  no_mouth,
  smirk,
  unamused,
  roll_eyes,
  grimacing,
  lying_face,
  relieved,
  pensive,
  sleepy,
  drooling_face,
  sleeping,
  mask,
  face_with_thermometer,
  face_with_head_bandage,
  nauseated_face,
  vomiting_face,
  sneezing_face,
  hot_face,
  cold_face,
  woozy_face,
  dizzy_face,
  exploding_head,
  cowboy_hat_face,
  partying_face,
  disguised_face,
  sunglasses,
  nerd_face,
  monocle_face,
  confused,
  worried,
  slightly_frowning_face,
  frowning_face,
  open_mouth,
  hushed,
  astonished,
  flushed,
  pleading_face,
  frowning,
  anguished,
  fearful,
  cold_sweat,
  disappointed_relieved,
  cry,
  sob,
  scream,
  confounded,
  persevere,
  disappointed,
  sweat,
  weary,
  tired_face,
  yawning_face,
  triumph,
  rage,
  pout,
  angry,
  cursing_face,
  smiling_imp,
  imp,
  skull,
  skull_and_crossbones,
  hankey,
  poop,
  shit,
  clown_face,
  japanese_ogre,
  japanese_goblin,
  ghost,
  alien,
  space_invader,
  robot,
  smiley_cat,
  smile_cat,
  joy_cat,
  heart_eyes_cat,
  smirk_cat,
  kissing_cat,
  scream_cat,
  crying_cat_face,
  pouting_cat,
  see_no_evil,
  hear_no_evil,
  speak_no_evil,
  kiss,
  love_letter,
  cupid,
  gift_heart,
  sparkling_heart,
  heartpulse,
  heartbeat,
  revolving_hearts,
  two_hearts,
  heart_decoration,
  heavy_heart_exclamation,
  broken_heart,
  heart,
  orange_heart,
  yellow_heart,
  green_heart,
  blue_heart,
  purple_heart,
  brown_heart,
  black_heart,
  white_heart,
  anger,
  boom,
  collision,
  dizzy,
  sweat_drops,
  dash,
  hole,
  bomb,
  speech_balloon,
  eye_speech_bubble,
  left_speech_bubble,
  right_anger_bubble,
  thought_balloon,
  zzz,
  wave,
  raised_back_of_hand,
  raised_hand_with_fingers_splayed,
  hand,
  raised_hand,
  vulcan_salute,
  ok_hand,
  pinched_fingers,
  pinching_hand,
  v,
  crossed_fingers,
  love_you_gesture,
  metal,
  call_me_hand,
  point_left,
  point_right,
  point_up_2,
  middle_finger,
  fu,
  point_down,
  point_up,
  "+1": "\u{1F44D}",
  thumbsup,
  "-1": "\u{1F44E}",
  thumbsdown,
  fist_raised,
  fist,
  fist_oncoming,
  facepunch,
  punch,
  fist_left,
  fist_right,
  clap,
  raised_hands,
  open_hands,
  palms_up_together,
  handshake,
  pray,
  writing_hand,
  nail_care,
  selfie,
  muscle,
  mechanical_arm,
  mechanical_leg,
  leg,
  foot,
  ear,
  ear_with_hearing_aid,
  nose,
  brain,
  anatomical_heart,
  lungs,
  tooth,
  bone,
  eyes,
  eye,
  tongue,
  lips,
  baby,
  child,
  boy,
  girl,
  adult,
  blond_haired_person,
  man,
  bearded_person,
  red_haired_man,
  curly_haired_man,
  white_haired_man,
  bald_man,
  woman,
  red_haired_woman,
  person_red_hair,
  curly_haired_woman,
  person_curly_hair,
  white_haired_woman,
  person_white_hair,
  bald_woman,
  person_bald,
  blond_haired_woman,
  blonde_woman,
  blond_haired_man,
  older_adult,
  older_man,
  older_woman,
  frowning_person,
  frowning_man,
  frowning_woman,
  pouting_face,
  pouting_man,
  pouting_woman,
  no_good,
  no_good_man,
  ng_man,
  no_good_woman,
  ng_woman,
  ok_person,
  ok_man,
  ok_woman,
  tipping_hand_person,
  information_desk_person,
  tipping_hand_man,
  sassy_man,
  tipping_hand_woman,
  sassy_woman,
  raising_hand,
  raising_hand_man,
  raising_hand_woman,
  deaf_person,
  deaf_man,
  deaf_woman,
  bow,
  bowing_man,
  bowing_woman,
  facepalm,
  man_facepalming,
  woman_facepalming,
  shrug,
  man_shrugging,
  woman_shrugging,
  health_worker,
  man_health_worker,
  woman_health_worker,
  student,
  man_student,
  woman_student,
  teacher,
  man_teacher,
  woman_teacher,
  judge,
  man_judge,
  woman_judge,
  farmer,
  man_farmer,
  woman_farmer,
  cook,
  man_cook,
  woman_cook,
  mechanic,
  man_mechanic,
  woman_mechanic,
  factory_worker,
  man_factory_worker,
  woman_factory_worker,
  office_worker,
  man_office_worker,
  woman_office_worker,
  scientist,
  man_scientist,
  woman_scientist,
  technologist,
  man_technologist,
  woman_technologist,
  singer,
  man_singer,
  woman_singer,
  artist,
  man_artist,
  woman_artist,
  pilot,
  man_pilot,
  woman_pilot,
  astronaut,
  man_astronaut,
  woman_astronaut,
  firefighter,
  man_firefighter,
  woman_firefighter,
  police_officer,
  cop,
  policeman,
  policewoman,
  detective,
  male_detective,
  female_detective,
  guard,
  guardsman,
  guardswoman,
  ninja,
  construction_worker,
  construction_worker_man,
  construction_worker_woman,
  prince,
  princess,
  person_with_turban,
  man_with_turban,
  woman_with_turban,
  man_with_gua_pi_mao,
  woman_with_headscarf,
  person_in_tuxedo,
  man_in_tuxedo,
  woman_in_tuxedo,
  person_with_veil,
  man_with_veil,
  woman_with_veil,
  bride_with_veil,
  pregnant_woman,
  breast_feeding,
  woman_feeding_baby,
  man_feeding_baby,
  person_feeding_baby,
  angel,
  santa,
  mrs_claus,
  mx_claus,
  superhero,
  superhero_man,
  superhero_woman,
  supervillain,
  supervillain_man,
  supervillain_woman,
  mage,
  mage_man,
  mage_woman,
  fairy,
  fairy_man,
  fairy_woman,
  vampire,
  vampire_man,
  vampire_woman,
  merperson,
  merman,
  mermaid,
  elf,
  elf_man,
  elf_woman,
  genie,
  genie_man,
  genie_woman,
  zombie,
  zombie_man,
  zombie_woman,
  massage,
  massage_man,
  massage_woman,
  haircut,
  haircut_man,
  haircut_woman,
  walking,
  walking_man,
  walking_woman,
  standing_person,
  standing_man,
  standing_woman,
  kneeling_person,
  kneeling_man,
  kneeling_woman,
  person_with_probing_cane,
  man_with_probing_cane,
  woman_with_probing_cane,
  person_in_motorized_wheelchair,
  man_in_motorized_wheelchair,
  woman_in_motorized_wheelchair,
  person_in_manual_wheelchair,
  man_in_manual_wheelchair,
  woman_in_manual_wheelchair,
  runner,
  running,
  running_man,
  running_woman,
  woman_dancing,
  dancer,
  man_dancing,
  business_suit_levitating,
  dancers,
  dancing_men,
  dancing_women,
  sauna_person,
  sauna_man,
  sauna_woman,
  climbing,
  climbing_man,
  climbing_woman,
  person_fencing,
  horse_racing,
  skier,
  snowboarder,
  golfing,
  golfing_man,
  golfing_woman,
  surfer,
  surfing_man,
  surfing_woman,
  rowboat,
  rowing_man,
  rowing_woman,
  swimmer,
  swimming_man,
  swimming_woman,
  bouncing_ball_person,
  bouncing_ball_man,
  basketball_man,
  bouncing_ball_woman,
  basketball_woman,
  weight_lifting,
  weight_lifting_man,
  weight_lifting_woman,
  bicyclist,
  biking_man,
  biking_woman,
  mountain_bicyclist,
  mountain_biking_man,
  mountain_biking_woman,
  cartwheeling,
  man_cartwheeling,
  woman_cartwheeling,
  wrestling,
  men_wrestling,
  women_wrestling,
  water_polo,
  man_playing_water_polo,
  woman_playing_water_polo,
  handball_person,
  man_playing_handball,
  woman_playing_handball,
  juggling_person,
  man_juggling,
  woman_juggling,
  lotus_position,
  lotus_position_man,
  lotus_position_woman,
  bath,
  sleeping_bed,
  people_holding_hands,
  two_women_holding_hands,
  couple,
  two_men_holding_hands,
  couplekiss,
  couplekiss_man_woman,
  couplekiss_man_man,
  couplekiss_woman_woman,
  couple_with_heart,
  couple_with_heart_woman_man,
  couple_with_heart_man_man,
  couple_with_heart_woman_woman,
  family,
  family_man_woman_boy,
  family_man_woman_girl,
  family_man_woman_girl_boy,
  family_man_woman_boy_boy,
  family_man_woman_girl_girl,
  family_man_man_boy,
  family_man_man_girl,
  family_man_man_girl_boy,
  family_man_man_boy_boy,
  family_man_man_girl_girl,
  family_woman_woman_boy,
  family_woman_woman_girl,
  family_woman_woman_girl_boy,
  family_woman_woman_boy_boy,
  family_woman_woman_girl_girl,
  family_man_boy,
  family_man_boy_boy,
  family_man_girl,
  family_man_girl_boy,
  family_man_girl_girl,
  family_woman_boy,
  family_woman_boy_boy,
  family_woman_girl,
  family_woman_girl_boy,
  family_woman_girl_girl,
  speaking_head,
  bust_in_silhouette,
  busts_in_silhouette,
  people_hugging,
  footprints,
  monkey_face,
  monkey,
  gorilla,
  orangutan,
  dog,
  dog2,
  guide_dog,
  service_dog,
  poodle,
  wolf,
  fox_face,
  raccoon,
  cat,
  cat2,
  black_cat,
  lion,
  tiger,
  tiger2,
  leopard,
  horse,
  racehorse,
  unicorn,
  zebra,
  deer,
  bison,
  cow,
  ox,
  water_buffalo,
  cow2,
  pig,
  pig2,
  boar,
  pig_nose,
  ram,
  sheep,
  goat,
  dromedary_camel,
  camel,
  llama,
  giraffe,
  elephant,
  mammoth,
  rhinoceros,
  hippopotamus,
  mouse,
  mouse2,
  rat,
  hamster,
  rabbit,
  rabbit2,
  chipmunk,
  beaver,
  hedgehog,
  bat,
  bear,
  polar_bear,
  koala,
  panda_face,
  sloth,
  otter,
  skunk,
  kangaroo,
  badger,
  feet,
  paw_prints,
  turkey,
  chicken,
  rooster,
  hatching_chick,
  baby_chick,
  hatched_chick,
  bird,
  penguin,
  dove,
  eagle,
  duck,
  swan,
  owl,
  dodo,
  feather,
  flamingo,
  peacock,
  parrot,
  frog,
  crocodile,
  turtle,
  lizard,
  snake,
  dragon_face,
  dragon,
  sauropod,
  "t-rex": "\u{1F996}",
  whale,
  whale2,
  dolphin,
  flipper,
  seal,
  fish,
  tropical_fish,
  blowfish,
  shark,
  octopus,
  shell,
  snail,
  butterfly,
  bug,
  ant,
  bee,
  honeybee,
  beetle,
  lady_beetle,
  cricket,
  cockroach,
  spider,
  spider_web,
  scorpion,
  mosquito,
  fly,
  worm,
  microbe,
  bouquet,
  cherry_blossom,
  white_flower,
  rosette,
  rose,
  wilted_flower,
  hibiscus,
  sunflower,
  blossom,
  tulip,
  seedling,
  potted_plant,
  evergreen_tree,
  deciduous_tree,
  palm_tree,
  cactus,
  ear_of_rice,
  herb,
  shamrock,
  four_leaf_clover,
  maple_leaf,
  fallen_leaf,
  leaves,
  grapes,
  melon,
  watermelon,
  tangerine,
  orange,
  mandarin,
  lemon,
  banana,
  pineapple,
  mango,
  apple,
  green_apple,
  pear,
  peach,
  cherries,
  strawberry,
  blueberries,
  kiwi_fruit,
  tomato,
  olive,
  coconut,
  avocado,
  eggplant,
  potato,
  carrot,
  corn,
  hot_pepper,
  bell_pepper,
  cucumber,
  leafy_green,
  broccoli,
  garlic,
  onion,
  mushroom,
  peanuts,
  chestnut,
  bread,
  croissant,
  baguette_bread,
  flatbread,
  pretzel,
  bagel,
  pancakes,
  waffle,
  cheese,
  meat_on_bone,
  poultry_leg,
  cut_of_meat,
  bacon,
  hamburger,
  fries,
  pizza,
  hotdog,
  sandwich,
  taco,
  burrito,
  tamale,
  stuffed_flatbread,
  falafel,
  egg,
  fried_egg,
  shallow_pan_of_food,
  stew,
  fondue,
  bowl_with_spoon,
  green_salad,
  popcorn,
  butter,
  salt,
  canned_food,
  bento,
  rice_cracker,
  rice_ball,
  rice,
  curry,
  ramen,
  spaghetti,
  sweet_potato,
  oden,
  sushi,
  fried_shrimp,
  fish_cake,
  moon_cake,
  dango,
  dumpling,
  fortune_cookie,
  takeout_box,
  crab,
  lobster,
  shrimp,
  squid,
  oyster,
  icecream,
  shaved_ice,
  ice_cream,
  doughnut,
  cookie,
  birthday,
  cake,
  cupcake,
  pie,
  chocolate_bar,
  candy,
  lollipop,
  custard,
  honey_pot,
  baby_bottle,
  milk_glass,
  coffee,
  teapot,
  tea,
  sake,
  champagne,
  wine_glass,
  cocktail,
  tropical_drink,
  beer,
  beers,
  clinking_glasses,
  tumbler_glass,
  cup_with_straw,
  bubble_tea,
  beverage_box,
  mate,
  ice_cube,
  chopsticks,
  plate_with_cutlery,
  fork_and_knife,
  spoon,
  hocho,
  knife,
  amphora,
  earth_africa,
  earth_americas,
  earth_asia,
  globe_with_meridians,
  world_map,
  japan,
  compass,
  mountain_snow,
  mountain,
  volcano,
  mount_fuji,
  camping,
  beach_umbrella,
  desert,
  desert_island,
  national_park,
  stadium,
  classical_building,
  building_construction,
  bricks,
  rock,
  wood,
  hut,
  houses,
  derelict_house,
  house,
  house_with_garden,
  office,
  post_office,
  european_post_office,
  hospital,
  bank,
  hotel,
  love_hotel,
  convenience_store,
  school,
  department_store,
  factory,
  japanese_castle,
  european_castle,
  wedding,
  tokyo_tower,
  statue_of_liberty,
  church,
  mosque,
  hindu_temple,
  synagogue,
  shinto_shrine,
  kaaba,
  fountain,
  tent,
  foggy,
  night_with_stars,
  cityscape,
  sunrise_over_mountains,
  sunrise,
  city_sunset,
  city_sunrise,
  bridge_at_night,
  hotsprings,
  carousel_horse,
  ferris_wheel,
  roller_coaster,
  barber,
  circus_tent,
  steam_locomotive,
  railway_car,
  bullettrain_side,
  bullettrain_front,
  train2,
  metro,
  light_rail,
  station,
  tram,
  monorail,
  mountain_railway,
  train,
  bus,
  oncoming_bus,
  trolleybus,
  minibus,
  ambulance,
  fire_engine,
  police_car,
  oncoming_police_car,
  taxi,
  oncoming_taxi,
  car,
  red_car,
  oncoming_automobile,
  blue_car,
  pickup_truck,
  truck,
  articulated_lorry,
  tractor,
  racing_car,
  motorcycle,
  motor_scooter,
  manual_wheelchair,
  motorized_wheelchair,
  auto_rickshaw,
  bike,
  kick_scooter,
  skateboard,
  roller_skate,
  busstop,
  motorway,
  railway_track,
  oil_drum,
  fuelpump,
  rotating_light,
  traffic_light,
  vertical_traffic_light,
  stop_sign,
  construction,
  anchor,
  boat,
  sailboat,
  canoe,
  speedboat,
  passenger_ship,
  ferry,
  motor_boat,
  ship,
  airplane,
  small_airplane,
  flight_departure,
  flight_arrival,
  parachute,
  seat,
  helicopter,
  suspension_railway,
  mountain_cableway,
  aerial_tramway,
  artificial_satellite,
  rocket,
  flying_saucer,
  bellhop_bell,
  luggage,
  hourglass,
  hourglass_flowing_sand,
  watch,
  alarm_clock,
  stopwatch,
  timer_clock,
  mantelpiece_clock,
  clock12,
  clock1230,
  clock1,
  clock130,
  clock2,
  clock230,
  clock3,
  clock330,
  clock4,
  clock430,
  clock5,
  clock530,
  clock6,
  clock630,
  clock7,
  clock730,
  clock8,
  clock830,
  clock9,
  clock930,
  clock10,
  clock1030,
  clock11,
  clock1130,
  new_moon,
  waxing_crescent_moon,
  first_quarter_moon,
  moon,
  waxing_gibbous_moon,
  full_moon,
  waning_gibbous_moon,
  last_quarter_moon,
  waning_crescent_moon,
  crescent_moon,
  new_moon_with_face,
  first_quarter_moon_with_face,
  last_quarter_moon_with_face,
  thermometer,
  sunny,
  full_moon_with_face,
  sun_with_face,
  ringed_planet,
  star,
  star2,
  stars,
  milky_way,
  cloud,
  partly_sunny,
  cloud_with_lightning_and_rain,
  sun_behind_small_cloud,
  sun_behind_large_cloud,
  sun_behind_rain_cloud,
  cloud_with_rain,
  cloud_with_snow,
  cloud_with_lightning,
  tornado,
  fog,
  wind_face,
  cyclone,
  rainbow,
  closed_umbrella,
  open_umbrella,
  umbrella,
  parasol_on_ground,
  zap,
  snowflake,
  snowman_with_snow,
  snowman,
  comet,
  fire,
  droplet,
  ocean,
  jack_o_lantern,
  christmas_tree,
  fireworks,
  sparkler,
  firecracker,
  sparkles,
  balloon,
  tada,
  confetti_ball,
  tanabata_tree,
  bamboo,
  dolls,
  flags,
  wind_chime,
  rice_scene,
  red_envelope,
  ribbon,
  gift,
  reminder_ribbon,
  tickets,
  ticket,
  medal_military,
  trophy,
  medal_sports,
  "1st_place_medal": "\u{1F947}",
  "2nd_place_medal": "\u{1F948}",
  "3rd_place_medal": "\u{1F949}",
  soccer,
  baseball,
  softball,
  basketball,
  volleyball,
  football,
  rugby_football,
  tennis,
  flying_disc,
  bowling,
  cricket_game,
  field_hockey,
  ice_hockey,
  lacrosse,
  ping_pong,
  badminton,
  boxing_glove,
  martial_arts_uniform,
  goal_net,
  golf,
  ice_skate,
  fishing_pole_and_fish,
  diving_mask,
  running_shirt_with_sash,
  ski,
  sled,
  curling_stone,
  dart,
  yo_yo,
  kite,
  "8ball": "\u{1F3B1}",
  crystal_ball,
  magic_wand,
  nazar_amulet,
  video_game,
  joystick,
  slot_machine,
  game_die,
  jigsaw,
  teddy_bear,
  pinata,
  nesting_dolls,
  spades,
  hearts,
  diamonds,
  clubs,
  chess_pawn,
  black_joker,
  mahjong,
  flower_playing_cards,
  performing_arts,
  framed_picture,
  art,
  thread,
  sewing_needle,
  yarn,
  knot,
  eyeglasses,
  dark_sunglasses,
  goggles,
  lab_coat,
  safety_vest,
  necktie,
  shirt,
  tshirt,
  jeans,
  scarf,
  gloves,
  coat,
  socks,
  dress,
  kimono,
  sari,
  one_piece_swimsuit,
  swim_brief,
  shorts,
  bikini,
  womans_clothes,
  purse,
  handbag,
  pouch,
  shopping,
  school_satchel,
  thong_sandal,
  mans_shoe,
  shoe,
  athletic_shoe,
  hiking_boot,
  flat_shoe,
  high_heel,
  sandal,
  ballet_shoes,
  boot,
  crown,
  womans_hat,
  tophat,
  mortar_board,
  billed_cap,
  military_helmet,
  rescue_worker_helmet,
  prayer_beads,
  lipstick,
  ring,
  gem,
  mute,
  speaker,
  sound,
  loud_sound,
  loudspeaker,
  mega,
  postal_horn,
  bell,
  no_bell,
  musical_score,
  musical_note,
  notes,
  studio_microphone,
  level_slider,
  control_knobs,
  microphone,
  headphones,
  radio,
  saxophone,
  accordion,
  guitar,
  musical_keyboard,
  trumpet,
  violin,
  banjo,
  drum,
  long_drum,
  iphone,
  calling,
  phone,
  telephone,
  telephone_receiver,
  pager,
  fax,
  battery,
  electric_plug,
  computer,
  desktop_computer,
  printer,
  keyboard,
  computer_mouse,
  trackball,
  minidisc,
  floppy_disk,
  cd,
  dvd,
  abacus,
  movie_camera,
  film_strip,
  film_projector,
  clapper,
  tv,
  camera,
  camera_flash,
  video_camera,
  vhs,
  mag,
  mag_right,
  candle,
  bulb,
  flashlight,
  izakaya_lantern,
  lantern,
  diya_lamp,
  notebook_with_decorative_cover,
  closed_book,
  book,
  open_book,
  green_book,
  blue_book,
  orange_book,
  books,
  notebook,
  ledger,
  page_with_curl,
  scroll,
  page_facing_up,
  newspaper,
  newspaper_roll,
  bookmark_tabs,
  bookmark,
  label,
  moneybag,
  coin,
  yen,
  dollar,
  euro,
  pound,
  money_with_wings,
  credit_card,
  receipt,
  chart,
  envelope,
  email,
  "e-mail": "\u{1F4E7}",
  incoming_envelope,
  envelope_with_arrow,
  outbox_tray,
  inbox_tray,
  "package": "\u{1F4E6}",
  mailbox,
  mailbox_closed,
  mailbox_with_mail,
  mailbox_with_no_mail,
  postbox,
  ballot_box,
  pencil2,
  black_nib,
  fountain_pen,
  pen,
  paintbrush,
  crayon,
  memo,
  pencil,
  briefcase,
  file_folder,
  open_file_folder,
  card_index_dividers,
  date,
  calendar,
  spiral_notepad,
  spiral_calendar,
  card_index,
  chart_with_upwards_trend,
  chart_with_downwards_trend,
  bar_chart,
  clipboard,
  pushpin,
  round_pushpin,
  paperclip,
  paperclips,
  straight_ruler,
  triangular_ruler,
  scissors,
  card_file_box,
  file_cabinet,
  wastebasket,
  lock,
  unlock,
  lock_with_ink_pen,
  closed_lock_with_key,
  key,
  old_key,
  hammer,
  axe,
  pick,
  hammer_and_pick,
  hammer_and_wrench,
  dagger,
  crossed_swords,
  gun,
  boomerang,
  bow_and_arrow,
  shield,
  carpentry_saw,
  wrench,
  screwdriver,
  nut_and_bolt,
  gear,
  clamp,
  balance_scale,
  probing_cane,
  link,
  chains,
  hook,
  toolbox,
  magnet,
  ladder,
  alembic,
  test_tube,
  petri_dish,
  dna,
  microscope,
  telescope,
  satellite,
  syringe,
  drop_of_blood,
  pill,
  adhesive_bandage,
  stethoscope,
  door,
  elevator,
  mirror,
  window: window$1,
  bed,
  couch_and_lamp,
  chair,
  toilet,
  plunger,
  shower,
  bathtub,
  mouse_trap,
  razor,
  lotion_bottle,
  safety_pin,
  broom,
  basket,
  roll_of_paper,
  bucket,
  soap,
  toothbrush,
  sponge,
  fire_extinguisher,
  shopping_cart,
  smoking,
  coffin,
  headstone,
  funeral_urn,
  moyai,
  placard,
  atm,
  put_litter_in_its_place,
  potable_water,
  wheelchair,
  mens,
  womens,
  restroom,
  baby_symbol,
  wc,
  passport_control,
  customs,
  baggage_claim,
  left_luggage,
  warning,
  children_crossing,
  no_entry,
  no_entry_sign,
  no_bicycles,
  no_smoking,
  do_not_litter,
  "non-potable_water": "\u{1F6B1}",
  no_pedestrians,
  no_mobile_phones,
  underage,
  radioactive,
  biohazard,
  arrow_up,
  arrow_upper_right,
  arrow_right,
  arrow_lower_right,
  arrow_down,
  arrow_lower_left,
  arrow_left,
  arrow_upper_left,
  arrow_up_down,
  left_right_arrow,
  leftwards_arrow_with_hook,
  arrow_right_hook,
  arrow_heading_up,
  arrow_heading_down,
  arrows_clockwise,
  arrows_counterclockwise,
  back,
  end,
  on,
  soon,
  top,
  place_of_worship,
  atom_symbol,
  om,
  star_of_david,
  wheel_of_dharma,
  yin_yang,
  latin_cross,
  orthodox_cross,
  star_and_crescent,
  peace_symbol,
  menorah,
  six_pointed_star,
  aries,
  taurus,
  gemini,
  cancer,
  leo,
  virgo,
  libra,
  scorpius,
  sagittarius,
  capricorn,
  aquarius,
  pisces,
  ophiuchus,
  twisted_rightwards_arrows,
  repeat,
  repeat_one,
  arrow_forward,
  fast_forward,
  next_track_button,
  play_or_pause_button,
  arrow_backward,
  rewind,
  previous_track_button,
  arrow_up_small,
  arrow_double_up,
  arrow_down_small,
  arrow_double_down,
  pause_button,
  stop_button,
  record_button,
  eject_button,
  cinema,
  low_brightness,
  high_brightness,
  signal_strength,
  vibration_mode,
  mobile_phone_off,
  female_sign,
  male_sign,
  transgender_symbol,
  heavy_multiplication_x,
  heavy_plus_sign,
  heavy_minus_sign,
  heavy_division_sign,
  infinity,
  bangbang,
  interrobang,
  question,
  grey_question,
  grey_exclamation,
  exclamation,
  heavy_exclamation_mark,
  wavy_dash,
  currency_exchange,
  heavy_dollar_sign,
  medical_symbol,
  recycle,
  fleur_de_lis,
  trident,
  name_badge,
  beginner,
  o: o$1,
  white_check_mark,
  ballot_box_with_check,
  heavy_check_mark,
  x,
  negative_squared_cross_mark,
  curly_loop,
  loop,
  part_alternation_mark,
  eight_spoked_asterisk,
  eight_pointed_black_star,
  sparkle,
  copyright,
  registered,
  tm,
  hash,
  asterisk,
  zero,
  one,
  two,
  three,
  four,
  five,
  six,
  seven,
  eight,
  nine,
  keycap_ten,
  capital_abcd,
  abcd,
  symbols,
  abc,
  a: a$1,
  ab,
  b: b$1,
  cl,
  cool,
  free,
  information_source,
  id: id$1,
  m,
  "new": "\u{1F195}",
  ng,
  o2,
  ok,
  parking,
  sos,
  up,
  vs,
  koko,
  sa,
  ideograph_advantage,
  accept,
  congratulations,
  secret,
  u6e80,
  red_circle,
  orange_circle,
  yellow_circle,
  green_circle,
  large_blue_circle,
  purple_circle,
  brown_circle,
  black_circle,
  white_circle,
  red_square,
  orange_square,
  yellow_square,
  green_square,
  blue_square,
  purple_square,
  brown_square,
  black_large_square,
  white_large_square,
  black_medium_square,
  white_medium_square,
  black_medium_small_square,
  white_medium_small_square,
  black_small_square,
  white_small_square,
  large_orange_diamond,
  large_blue_diamond,
  small_orange_diamond,
  small_blue_diamond,
  small_red_triangle,
  small_red_triangle_down,
  diamond_shape_with_a_dot_inside,
  radio_button,
  white_square_button,
  black_square_button,
  checkered_flag,
  triangular_flag_on_post,
  crossed_flags,
  black_flag,
  white_flag,
  rainbow_flag,
  transgender_flag,
  pirate_flag,
  ascension_island,
  andorra,
  united_arab_emirates,
  afghanistan,
  antigua_barbuda,
  anguilla,
  albania,
  armenia,
  angola,
  antarctica,
  argentina,
  american_samoa,
  austria,
  australia,
  aruba,
  aland_islands,
  azerbaijan,
  bosnia_herzegovina,
  barbados,
  bangladesh,
  belgium,
  burkina_faso,
  bulgaria,
  bahrain,
  burundi,
  benin,
  st_barthelemy,
  bermuda,
  brunei,
  bolivia,
  caribbean_netherlands,
  brazil,
  bahamas,
  bhutan,
  bouvet_island,
  botswana,
  belarus,
  belize,
  canada,
  cocos_islands,
  congo_kinshasa,
  central_african_republic,
  congo_brazzaville,
  switzerland,
  cote_divoire,
  cook_islands,
  chile,
  cameroon,
  cn,
  colombia,
  clipperton_island,
  costa_rica,
  cuba,
  cape_verde,
  curacao,
  christmas_island,
  cyprus,
  czech_republic,
  de,
  diego_garcia,
  djibouti,
  denmark,
  dominica,
  dominican_republic,
  algeria,
  ceuta_melilla,
  ecuador,
  estonia,
  egypt,
  western_sahara,
  eritrea,
  es,
  ethiopia,
  eu,
  european_union,
  finland,
  fiji,
  falkland_islands,
  micronesia,
  faroe_islands,
  fr,
  gabon,
  gb,
  uk,
  grenada,
  georgia,
  french_guiana,
  guernsey,
  ghana,
  gibraltar,
  greenland,
  gambia,
  guinea,
  guadeloupe,
  equatorial_guinea,
  greece,
  south_georgia_south_sandwich_islands,
  guatemala,
  guam,
  guinea_bissau,
  guyana,
  hong_kong,
  heard_mcdonald_islands,
  honduras,
  croatia,
  haiti,
  hungary,
  canary_islands,
  indonesia,
  ireland,
  israel,
  isle_of_man,
  india,
  british_indian_ocean_territory,
  iraq,
  iran,
  iceland,
  it,
  jersey,
  jamaica,
  jordan,
  jp,
  kenya,
  kyrgyzstan,
  cambodia,
  kiribati,
  comoros,
  st_kitts_nevis,
  north_korea,
  kr,
  kuwait,
  cayman_islands,
  kazakhstan,
  laos,
  lebanon,
  st_lucia,
  liechtenstein,
  sri_lanka,
  liberia,
  lesotho,
  lithuania,
  luxembourg,
  latvia,
  libya,
  morocco,
  monaco,
  moldova,
  montenegro,
  st_martin,
  madagascar,
  marshall_islands,
  macedonia,
  mali,
  myanmar,
  mongolia,
  macau,
  northern_mariana_islands,
  martinique,
  mauritania,
  montserrat,
  malta,
  mauritius,
  maldives,
  malawi,
  mexico,
  malaysia,
  mozambique,
  namibia,
  new_caledonia,
  niger,
  norfolk_island,
  nigeria,
  nicaragua,
  netherlands,
  norway,
  nepal,
  nauru,
  niue,
  new_zealand,
  oman,
  panama,
  peru,
  french_polynesia,
  papua_new_guinea,
  philippines,
  pakistan,
  poland,
  st_pierre_miquelon,
  pitcairn_islands,
  puerto_rico,
  palestinian_territories,
  portugal,
  palau,
  paraguay,
  qatar,
  reunion,
  romania,
  serbia,
  ru,
  rwanda,
  saudi_arabia,
  solomon_islands,
  seychelles,
  sudan,
  sweden,
  singapore,
  st_helena,
  slovenia,
  svalbard_jan_mayen,
  slovakia,
  sierra_leone,
  san_marino,
  senegal,
  somalia,
  suriname,
  south_sudan,
  sao_tome_principe,
  el_salvador,
  sint_maarten,
  syria,
  swaziland,
  tristan_da_cunha,
  turks_caicos_islands,
  chad,
  french_southern_territories,
  togo,
  thailand,
  tajikistan,
  tokelau,
  timor_leste,
  turkmenistan,
  tunisia,
  tonga,
  tr,
  trinidad_tobago,
  tuvalu,
  taiwan,
  tanzania,
  ukraine,
  uganda,
  us_outlying_islands,
  united_nations,
  us,
  uruguay,
  uzbekistan,
  vatican_city,
  st_vincent_grenadines,
  venezuela,
  british_virgin_islands,
  us_virgin_islands,
  vietnam,
  vanuatu,
  wallis_futuna,
  samoa,
  kosovo,
  yemen,
  mayotte,
  south_africa,
  zambia,
  zimbabwe,
  england,
  scotland,
  wales
};
var shortcuts = {
  angry: [">:(", ">:-("],
  blush: [':")', ':-")'],
  broken_heart: ["</3", "<\\3"],
  confused: [":/", ":-/"],
  cry: [":'(", ":'-(", ":,(", ":,-("],
  frowning: [":(", ":-("],
  heart: ["<3"],
  imp: ["]:(", "]:-("],
  innocent: ["o:)", "O:)", "o:-)", "O:-)", "0:)", "0:-)"],
  joy: [":')", ":'-)", ":,)", ":,-)", ":'D", ":'-D", ":,D", ":,-D"],
  kissing: [":*", ":-*"],
  laughing: ["x-)", "X-)"],
  neutral_face: [":|", ":-|"],
  open_mouth: [":o", ":-o", ":O", ":-O"],
  rage: [":@", ":-@"],
  smile: [":D", ":-D"],
  smiley: [":)", ":-)"],
  smiling_imp: ["]:)", "]:-)"],
  sob: [":,'(", ":,'-(", ";(", ";-("],
  stuck_out_tongue: [":P", ":-P"],
  sunglasses: ["8-)", "B-)"],
  sweat: [",:(", ",:-("],
  sweat_smile: [",:)", ",:-)"],
  unamused: [":s", ":-S", ":z", ":-Z", ":$", ":-$"],
  wink: [";)", ";-)"]
};
var render = function emoji_html2(tokens, idx) {
  return tokens[idx].content;
};
var replace = function create_rule(md, emojies, shortcuts2, scanRE, replaceRE) {
  var arrayReplaceAt = md.utils.arrayReplaceAt, ucm = md.utils.lib.ucmicro, ZPCc = new RegExp([ucm.Z.source, ucm.P.source, ucm.Cc.source].join("|"));
  function splitTextToken(text, level, Token) {
    var token, last_pos = 0, nodes = [];
    text.replace(replaceRE, function(match, offset, src) {
      var emoji_name;
      if (shortcuts2.hasOwnProperty(match)) {
        emoji_name = shortcuts2[match];
        if (offset > 0 && !ZPCc.test(src[offset - 1])) {
          return;
        }
        if (offset + match.length < src.length && !ZPCc.test(src[offset + match.length])) {
          return;
        }
      } else {
        emoji_name = match.slice(1, -1);
      }
      if (offset > last_pos) {
        token = new Token("text", "", 0);
        token.content = text.slice(last_pos, offset);
        nodes.push(token);
      }
      token = new Token("emoji", "", 0);
      token.markup = emoji_name;
      token.content = emojies[emoji_name];
      nodes.push(token);
      last_pos = offset + match.length;
    });
    if (last_pos < text.length) {
      token = new Token("text", "", 0);
      token.content = text.slice(last_pos);
      nodes.push(token);
    }
    return nodes;
  }
  return function emoji_replace2(state) {
    var i2, j, l2, tokens, token, blockTokens = state.tokens, autolinkLevel = 0;
    for (j = 0, l2 = blockTokens.length; j < l2; j++) {
      if (blockTokens[j].type !== "inline") {
        continue;
      }
      tokens = blockTokens[j].children;
      for (i2 = tokens.length - 1; i2 >= 0; i2--) {
        token = tokens[i2];
        if (token.type === "link_open" || token.type === "link_close") {
          if (token.info === "auto") {
            autolinkLevel -= token.nesting;
          }
        }
        if (token.type === "text" && autolinkLevel === 0 && scanRE.test(token.content)) {
          blockTokens[j].children = tokens = arrayReplaceAt(tokens, i2, splitTextToken(token.content, token.level, state.Token));
        }
      }
    }
  };
};
function quoteRE(str) {
  return str.replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
}
var normalize_opts$1 = function normalize_opts2(options) {
  var emojies = options.defs, shortcuts2;
  if (options.enabled.length) {
    emojies = Object.keys(emojies).reduce(function(acc, key2) {
      if (options.enabled.indexOf(key2) >= 0) {
        acc[key2] = emojies[key2];
      }
      return acc;
    }, {});
  }
  shortcuts2 = Object.keys(options.shortcuts).reduce(function(acc, key2) {
    if (!emojies[key2]) {
      return acc;
    }
    if (Array.isArray(options.shortcuts[key2])) {
      options.shortcuts[key2].forEach(function(alias) {
        acc[alias] = key2;
      });
      return acc;
    }
    acc[options.shortcuts[key2]] = key2;
    return acc;
  }, {});
  var keys = Object.keys(emojies), names;
  if (keys.length === 0) {
    names = "^$";
  } else {
    names = keys.map(function(name) {
      return ":" + name + ":";
    }).concat(Object.keys(shortcuts2)).sort().reverse().map(function(name) {
      return quoteRE(name);
    }).join("|");
  }
  var scanRE = RegExp(names);
  var replaceRE = RegExp(names, "g");
  return {
    defs: emojies,
    shortcuts: shortcuts2,
    scanRE,
    replaceRE
  };
};
var emoji_html = render;
var emoji_replace = replace;
var normalize_opts = normalize_opts$1;
var bare = function emoji_plugin(md, options) {
  var defaults = {
    defs: {},
    shortcuts: {},
    enabled: []
  };
  var opts = normalize_opts(md.utils.assign({}, defaults, options || {}));
  md.renderer.rules.emoji = emoji_html;
  md.core.ruler.push("emoji", emoji_replace(md, opts.defs, opts.shortcuts, opts.scanRE, opts.replaceRE));
};
var emojies_defs = require$$0;
var emojies_shortcuts = shortcuts;
var bare_emoji_plugin = bare;
var markdownItEmoji = function emoji_plugin2(md, options) {
  var defaults = {
    defs: emojies_defs,
    shortcuts: emojies_shortcuts,
    enabled: []
  };
  var opts = md.utils.assign({}, defaults, options || {});
  bare_emoji_plugin(md, opts);
};
var markdownItContainer = function container_plugin(md, name, options) {
  function validateDefault(params) {
    return params.trim().split(" ", 2)[0] === name;
  }
  function renderDefault(tokens, idx, _options, env, slf) {
    if (tokens[idx].nesting === 1) {
      tokens[idx].attrJoin("class", name);
    }
    return slf.renderToken(tokens, idx, _options, env, slf);
  }
  options = options || {};
  var min_markers = 3, marker_str = options.marker || ":", marker_char = marker_str.charCodeAt(0), marker_len = marker_str.length, validate = options.validate || validateDefault, render2 = options.render || renderDefault;
  function container(state, startLine, endLine, silent) {
    var pos, nextLine, marker_count, markup, params, token, old_parent, old_line_max, auto_closed = false, start = state.bMarks[startLine] + state.tShift[startLine], max = state.eMarks[startLine];
    if (marker_char !== state.src.charCodeAt(start)) {
      return false;
    }
    for (pos = start + 1; pos <= max; pos++) {
      if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
        break;
      }
    }
    marker_count = Math.floor((pos - start) / marker_len);
    if (marker_count < min_markers) {
      return false;
    }
    pos -= (pos - start) % marker_len;
    markup = state.src.slice(start, pos);
    params = state.src.slice(pos, max);
    if (!validate(params, markup)) {
      return false;
    }
    if (silent) {
      return true;
    }
    nextLine = startLine;
    for (; ; ) {
      nextLine++;
      if (nextLine >= endLine) {
        break;
      }
      start = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];
      if (start < max && state.sCount[nextLine] < state.blkIndent) {
        break;
      }
      if (marker_char !== state.src.charCodeAt(start)) {
        continue;
      }
      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        continue;
      }
      for (pos = start + 1; pos <= max; pos++) {
        if (marker_str[(pos - start) % marker_len] !== state.src[pos]) {
          break;
        }
      }
      if (Math.floor((pos - start) / marker_len) < marker_count) {
        continue;
      }
      pos -= (pos - start) % marker_len;
      pos = state.skipSpaces(pos);
      if (pos < max) {
        continue;
      }
      auto_closed = true;
      break;
    }
    old_parent = state.parentType;
    old_line_max = state.lineMax;
    state.parentType = "container";
    state.lineMax = nextLine;
    token = state.push("container_" + name + "_open", "div", 1);
    token.markup = markup;
    token.block = true;
    token.info = params;
    token.map = [startLine, nextLine];
    state.md.block.tokenize(state, startLine + 1, nextLine);
    token = state.push("container_" + name + "_close", "div", -1);
    token.markup = state.src.slice(start, pos);
    token.block = true;
    state.parentType = old_parent;
    state.lineMax = old_line_max;
    state.line = nextLine + (auto_closed ? 1 : 0);
    return true;
  }
  md.block.ruler.before("fence", "container_" + name, container, {
    alt: ["paragraph", "reference", "blockquote", "list"]
  });
  md.renderer.rules["container_" + name + "_open"] = render2;
  md.renderer.rules["container_" + name + "_close"] = render2;
};
function Container(md) {
  createContainer({
    md,
    name: "code",
    renders: {
      open() {
        return "<details><summary>\u70B9\u51FB\u67E5\u770B\u4EE3\u7801</summary>\n";
      },
      close() {
        return "</details>\n";
      }
    }
  });
  createCommonContainer(md, CommonContainerNames.INFO);
  createCommonContainer(md, CommonContainerNames.WARNING);
  createCommonContainer(md, CommonContainerNames.SUCCESS);
  createCommonContainer(md, CommonContainerNames.ERROR);
}
function createCommonContainer(md, name) {
  createContainer({
    md,
    name,
    renders: {
      open(tokens, idx) {
        var m2 = tokens[idx].info.trim().match(RegExp(`^${name}\\s+(.*)$`));
        return `
                        <div class='container-${name}'>
                            <p class='container-title'>${(m2 == null ? void 0 : m2[1]) || ""}</p>
                        <div class='container-body'>
                            `;
      },
      close() {
        return "</div></div>";
      }
    }
  });
}
function createContainer({ md, name, renders, maker = ":" }) {
  md.use(markdownItContainer, name, {
    maker,
    validate: (params) => RegExp(name).test(params.trim()),
    render: (tokens, idx) => {
      if (tokens[idx].nesting === 1) {
        return renders.open(tokens, idx);
      } else {
        return renders.close(tokens, idx);
      }
    }
  });
}
var CommonContainerNames;
(function(CommonContainerNames2) {
  CommonContainerNames2["INFO"] = "info";
  CommonContainerNames2["WARNING"] = "warning";
  CommonContainerNames2["SUCCESS"] = "success";
  CommonContainerNames2["ERROR"] = "error";
})(CommonContainerNames || (CommonContainerNames = {}));
var e$1 = false, n$1 = { false: "push", true: "unshift", after: "push", before: "unshift" }, t = { isPermalinkSymbol: true };
function r(r2, a2, i2, l2) {
  var o3;
  if (!e$1) {
    var c2 = "Using deprecated markdown-it-anchor permalink option, see https://github.com/valeriangalliat/markdown-it-anchor#todo-anchor-or-file";
    typeof process == "object" && process && process.emitWarning ? process.emitWarning(c2) : console.warn(c2), e$1 = true;
  }
  var s2 = [Object.assign(new i2.Token("link_open", "a", 1), { attrs: [].concat(a2.permalinkClass ? [["class", a2.permalinkClass]] : [], [["href", a2.permalinkHref(r2, i2)]], Object.entries(a2.permalinkAttrs(r2, i2))) }), Object.assign(new i2.Token("html_block", "", 0), { content: a2.permalinkSymbol, meta: t }), new i2.Token("link_close", "a", -1)];
  a2.permalinkSpace && i2.tokens[l2 + 1].children[n$1[a2.permalinkBefore]](Object.assign(new i2.Token("text", "", 0), { content: " " })), (o3 = i2.tokens[l2 + 1].children)[n$1[a2.permalinkBefore]].apply(o3, s2);
}
function a(e2) {
  return "#" + e2;
}
function i(e2) {
  return {};
}
var l = { class: "header-anchor", symbol: "#", renderHref: a, renderAttrs: i };
function o(e2) {
  function n2(t2) {
    return t2 = Object.assign({}, n2.defaults, t2), function(n3, r2, a2, i2) {
      return e2(n3, t2, r2, a2, i2);
    };
  }
  return n2.defaults = Object.assign({}, l), n2.renderPermalinkImpl = e2, n2;
}
var c = o(function(e2, r2, a2, i2, l2) {
  var o3, c2 = [Object.assign(new i2.Token("link_open", "a", 1), { attrs: [].concat(r2.class ? [["class", r2.class]] : [], [["href", r2.renderHref(e2, i2)]], r2.ariaHidden ? [["aria-hidden", "true"]] : [], Object.entries(r2.renderAttrs(e2, i2))) }), Object.assign(new i2.Token("html_inline", "", 0), { content: r2.symbol, meta: t }), new i2.Token("link_close", "a", -1)];
  r2.space && i2.tokens[l2 + 1].children[n$1[r2.placement]](Object.assign(new i2.Token("text", "", 0), { content: " " })), (o3 = i2.tokens[l2 + 1].children)[n$1[r2.placement]].apply(o3, c2);
});
Object.assign(c.defaults, { space: true, placement: "after", ariaHidden: false });
var s = o(c.renderPermalinkImpl);
s.defaults = Object.assign({}, c.defaults, { ariaHidden: true });
var d = o(function(e2, n2, t2, r2, a2) {
  var i2 = [Object.assign(new r2.Token("link_open", "a", 1), { attrs: [].concat(n2.class ? [["class", n2.class]] : [], [["href", n2.renderHref(e2, r2)]], Object.entries(n2.renderAttrs(e2, r2))) })].concat(r2.tokens[a2 + 1].children, [new r2.Token("link_close", "a", -1)]);
  r2.tokens[a2 + 1] = Object.assign(new r2.Token("inline", "", 0), { children: i2 });
}), u = o(function(e2, r2, a2, i2, l2) {
  var o3;
  if (!["visually-hidden", "aria-label", "aria-describedby", "aria-labelledby"].includes(r2.style))
    throw new Error("`permalink.linkAfterHeader` called with unknown style option `" + r2.style + "`");
  if (!["aria-describedby", "aria-labelledby"].includes(r2.style) && !r2.assistiveText)
    throw new Error("`permalink.linkAfterHeader` called without the `assistiveText` option in `" + r2.style + "` style");
  if (r2.style === "visually-hidden" && !r2.visuallyHiddenClass)
    throw new Error("`permalink.linkAfterHeader` called without the `visuallyHiddenClass` option in `visually-hidden` style");
  var c2 = i2.tokens[l2 + 1].children.filter(function(e3) {
    return e3.type === "text" || e3.type === "code_inline";
  }).reduce(function(e3, n2) {
    return e3 + n2.content;
  }, ""), s2 = [], d2 = [];
  r2.class && d2.push(["class", r2.class]), d2.push(["href", r2.renderHref(e2, i2)]), d2.push.apply(d2, Object.entries(r2.renderAttrs(e2, i2))), r2.style === "visually-hidden" ? (s2.push(Object.assign(new i2.Token("span_open", "span", 1), { attrs: [["class", r2.visuallyHiddenClass]] }), Object.assign(new i2.Token("text", "", 0), { content: r2.assistiveText(c2) }), new i2.Token("span_close", "span", -1)), r2.space && s2[n$1[r2.placement]](Object.assign(new i2.Token("text", "", 0), { content: " " })), s2[n$1[r2.placement]](Object.assign(new i2.Token("span_open", "span", 1), { attrs: [["aria-hidden", "true"]] }), Object.assign(new i2.Token("html_inline", "", 0), { content: r2.symbol, meta: t }), new i2.Token("span_close", "span", -1))) : s2.push(Object.assign(new i2.Token("html_inline", "", 0), { content: r2.symbol, meta: t })), r2.style === "aria-label" ? d2.push(["aria-label", r2.assistiveText(c2)]) : ["aria-describedby", "aria-labelledby"].includes(r2.style) && d2.push([r2.style, e2]);
  var u2 = [Object.assign(new i2.Token("link_open", "a", 1), { attrs: d2 })].concat(s2, [new i2.Token("link_close", "a", -1)]);
  (o3 = i2.tokens).splice.apply(o3, [l2 + 3, 0].concat(u2));
});
function f(e2, n2, t2, r2) {
  var a2 = e2, i2 = r2;
  if (t2 && Object.prototype.hasOwnProperty.call(n2, a2))
    throw new Error("User defined `id` attribute `" + e2 + "` is not unique. Please fix it in your Markdown to continue.");
  for (; Object.prototype.hasOwnProperty.call(n2, a2); )
    a2 = e2 + "-" + i2, i2 += 1;
  return n2[a2] = true, a2;
}
function b(e2, n2) {
  n2 = Object.assign({}, b.defaults, n2), e2.core.ruler.push("anchor", function(e3) {
    for (var t2, a2 = {}, i2 = e3.tokens, l2 = Array.isArray(n2.level) ? (t2 = n2.level, function(e4) {
      return t2.includes(e4);
    }) : function(e4) {
      return function(n3) {
        return n3 >= e4;
      };
    }(n2.level), o3 = 0; o3 < i2.length; o3++) {
      var c2 = i2[o3];
      if (c2.type === "heading_open" && l2(Number(c2.tag.substr(1)))) {
        var s2 = i2[o3 + 1].children.filter(function(e4) {
          return e4.type === "text" || e4.type === "code_inline";
        }).reduce(function(e4, n3) {
          return e4 + n3.content;
        }, ""), d2 = c2.attrGet("id");
        d2 = d2 == null ? f(n2.slugify(s2), a2, false, n2.uniqueSlugStartIndex) : f(d2, a2, true, n2.uniqueSlugStartIndex), c2.attrSet("id", d2), n2.tabIndex !== false && c2.attrSet("tabindex", "" + n2.tabIndex), typeof n2.permalink == "function" ? n2.permalink(d2, n2, e3, o3) : (n2.permalink || n2.renderPermalink && n2.renderPermalink !== r) && n2.renderPermalink(d2, n2, e3, o3), o3 = i2.indexOf(c2), n2.callback && n2.callback(c2, { slug: d2, title: s2 });
      }
    }
  });
}
Object.assign(u.defaults, { style: "visually-hidden", space: true, placement: "after" }), b.permalink = { __proto__: null, legacy: r, renderHref: a, renderAttrs: i, makePermalink: o, linkInsideHeader: c, ariaHidden: s, headerLink: d, linkAfterHeader: u }, b.defaults = { level: 1, slugify: function(e2) {
  return encodeURIComponent(String(e2).trim().toLowerCase().replace(/\s+/g, "-"));
}, uniqueSlugStartIndex: 1, tabIndex: "-1", permalink: false, renderPermalink: r, permalinkClass: s.defaults.class, permalinkSpace: s.defaults.space, permalinkSymbol: "\xB6", permalinkBefore: s.defaults.placement === "before", permalinkHref: s.defaults.renderHref, permalinkAttrs: s.defaults.renderAttrs };
function e(e2) {
  return encodeURIComponent(String(e2).trim().toLowerCase().replace(/\s+/g, "-"));
}
function n(e2) {
  return String(e2).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function TocDoneRight(r2, t2) {
  var l2;
  t2 = Object.assign({}, { placeholder: "(\\$\\{toc\\}|\\[\\[?_?toc_?\\]?\\]|\\$\\<toc(\\{[^}]*\\})\\>)", slugify: e, uniqueSlugStartIndex: 1, containerClass: "table-of-contents", containerId: void 0, listClass: void 0, itemClass: void 0, linkClass: void 0, level: 1, listType: "ol", format: void 0, callback: void 0 }, t2);
  var i2 = new RegExp("^" + t2.placeholder + "$", "i");
  r2.renderer.rules.tocOpen = function(e2, r3) {
    var l3 = Object.assign({}, t2);
    return e2 && r3 >= 0 && (l3 = Object.assign(l3, e2[r3].inlineOptions)), "<nav" + (l3.containerId ? ' id="' + n(l3.containerId) + '"' : "") + ' class="' + n(l3.containerClass) + '">';
  }, r2.renderer.rules.tocClose = function() {
    return "</nav>";
  }, r2.renderer.rules.tocBody = function(e2, r3) {
    var i3 = Object.assign({}, t2);
    e2 && r3 >= 0 && (i3 = Object.assign(i3, e2[r3].inlineOptions));
    var s2, a2 = {}, c2 = Array.isArray(i3.level) ? (s2 = i3.level, function(e3) {
      return s2.includes(e3);
    }) : function(e3) {
      return function(n2) {
        return n2 >= e3;
      };
    }(i3.level);
    return function e3(r4) {
      var l3 = i3.listClass ? ' class="' + n(i3.listClass) + '"' : "", s3 = i3.itemClass ? ' class="' + n(i3.itemClass) + '"' : "", o3 = i3.linkClass ? ' class="' + n(i3.linkClass) + '"' : "";
      if (r4.c.length === 0)
        return "";
      var u2 = "";
      return (r4.l === 0 || c2(r4.l)) && (u2 += "<" + (n(i3.listType) + l3) + ">"), r4.c.forEach(function(r5) {
        c2(r5.l) ? u2 += "<li" + s3 + "><a" + o3 + ' href="#' + function(e4) {
          for (var n2 = e4, r6 = i3.uniqueSlugStartIndex; Object.prototype.hasOwnProperty.call(a2, n2); )
            n2 = e4 + "-" + r6++;
          return a2[n2] = true, n2;
        }(t2.slugify(r5.n)) + '">' + (typeof i3.format == "function" ? i3.format(r5.n, n) : n(r5.n)) + "</a>" + e3(r5) + "</li>" : u2 += e3(r5);
      }), (r4.l === 0 || c2(r4.l)) && (u2 += "</" + n(i3.listType) + ">"), u2;
    }(l2);
  }, r2.core.ruler.push("generateTocAst", function(e2) {
    l2 = function(e3) {
      for (var n2 = { l: 0, n: "", c: [] }, r3 = [n2], t3 = 0, l3 = e3.length; t3 < l3; t3++) {
        var i3 = e3[t3];
        if (i3.type === "heading_open") {
          var s2 = e3[t3 + 1].children.filter(function(e4) {
            return e4.type === "text" || e4.type === "code_inline";
          }).reduce(function(e4, n3) {
            return e4 + n3.content;
          }, ""), a2 = { l: parseInt(i3.tag.substr(1), 10), n: s2, c: [] };
          if (a2.l > r3[0].l)
            r3[0].c.push(a2), r3.unshift(a2);
          else if (a2.l === r3[0].l)
            r3[1].c.push(a2), r3[0] = a2;
          else {
            for (; a2.l <= r3[0].l; )
              r3.shift();
            r3[0].c.push(a2), r3.unshift(a2);
          }
        }
      }
      return n2;
    }(e2.tokens), typeof t2.callback == "function" && t2.callback(r2.renderer.rules.tocOpen() + r2.renderer.rules.tocBody() + r2.renderer.rules.tocClose(), l2);
  }), r2.block.ruler.before("heading", "toc", function(e2, n2, r3, t3) {
    var l3, s2 = e2.src.slice(e2.bMarks[n2] + e2.tShift[n2], e2.eMarks[n2]).split(" ")[0];
    if (!i2.test(s2))
      return false;
    if (t3)
      return true;
    var a2 = i2.exec(s2), c2 = {};
    if (a2 !== null && a2.length === 3)
      try {
        c2 = JSON.parse(a2[2]);
      } catch (e3) {
      }
    return e2.line = n2 + 1, (l3 = e2.push("tocOpen", "nav", 1)).markup = "", l3.map = [n2, e2.line], l3.inlineOptions = c2, (l3 = e2.push("tocBody", "", 0)).markup = "", l3.map = [n2, e2.line], l3.inlineOptions = c2, l3.children = [], (l3 = e2.push("tocClose", "nav", -1)).markup = "", true;
  }, { alt: ["paragraph", "reference", "blockquote"] });
}
const defaultSource = "jsDriver";
const defaultVersion = "11.2.0";
const supportSources = {
  cdnjs: "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/${version}/styles/",
  jsDriver: "https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@${version}/build/styles/",
  unpkg: "https://unpkg.com/@highlightjs/cdn-assets@${version}/styles/"
};
const styles = [
  "base16/3024",
  "base16/apathy",
  "base16/apprentice",
  "base16/ashes",
  "base16/atelier-cave",
  "base16/atelier-cave-light",
  "base16/atelier-dune",
  "base16/atelier-dune-light",
  "base16/atelier-estuary",
  "base16/atelier-estuary-light",
  "base16/atelier-forest",
  "base16/atelier-forest-light",
  "base16/atelier-heath",
  "base16/atelier-heath-light",
  "base16/atelier-lakeside",
  "base16/atelier-lakeside-light",
  "base16/atelier-plateau",
  "base16/atelier-plateau-light",
  "base16/atelier-savanna",
  "base16/atelier-savanna-light",
  "base16/atelier-seaside",
  "base16/atelier-seaside-light",
  "base16/atelier-sulphurpool",
  "base16/atelier-sulphurpool-light",
  "base16/atlas",
  "base16/bespin",
  "base16/black-metal",
  "base16/black-metal-bathory",
  "base16/black-metal-burzum",
  "base16/black-metal-dark-funeral",
  "base16/black-metal-gorgoroth",
  "base16/black-metal-immortal",
  "base16/black-metal-khold",
  "base16/black-metal-marduk",
  "base16/black-metal-mayhem",
  "base16/black-metal-nile",
  "base16/black-metal-venom",
  "base16/brewer",
  "base16/bright",
  "base16/brogrammer",
  "base16/brush-trees",
  "base16/brush-trees-dark",
  "base16/chalk",
  "base16/circus",
  "base16/classic-dark",
  "base16/classic-light",
  "base16/codeschool",
  "base16/colors",
  "base16/cupcake",
  "base16/cupertino",
  "base16/danqing",
  "base16/darcula",
  "base16/dark-violet",
  "base16/darkmoss",
  "base16/darktooth",
  "base16/decaf",
  "base16/default-dark",
  "base16/default-light",
  "base16/dirtysea",
  "base16/dracula",
  "base16/edge-dark",
  "base16/edge-light",
  "base16/eighties",
  "base16/embers",
  "base16/equilibrium-dark",
  "base16/equilibrium-gray-dark",
  "base16/equilibrium-gray-light",
  "base16/equilibrium-light",
  "base16/espresso",
  "base16/eva",
  "base16/eva-dim",
  "base16/flat",
  "base16/framer",
  "base16/fruit-soda",
  "base16/gigavolt",
  "base16/github",
  "base16/google-dark",
  "base16/google-light",
  "base16/grayscale-dark",
  "base16/grayscale-light",
  "base16/green-screen",
  "base16/gruvbox-dark-hard",
  "base16/gruvbox-dark-medium",
  "base16/gruvbox-dark-pale",
  "base16/gruvbox-dark-soft",
  "base16/gruvbox-light-hard",
  "base16/gruvbox-light-medium",
  "base16/gruvbox-light-soft",
  "base16/hardcore",
  "base16/harmonic16-dark",
  "base16/harmonic16-light",
  "base16/heetch-dark",
  "base16/heetch-light",
  "base16/helios",
  "base16/hopscotch",
  "base16/horizon-dark",
  "base16/horizon-light",
  "base16/humanoid-dark",
  "base16/humanoid-light",
  "base16/ia-dark",
  "base16/ia-light",
  "base16/icy-dark",
  "base16/ir-black",
  "base16/isotope",
  "base16/kimber",
  "base16/london-tube",
  "base16/macintosh",
  "base16/marrakesh",
  "base16/materia",
  "base16/material",
  "base16/material-darker",
  "base16/material-lighter",
  "base16/material-palenight",
  "base16/material-vivid",
  "base16/mellow-purple",
  "base16/mexico-light",
  "base16/mocha",
  "base16/monokai",
  "base16/nebula",
  "base16/nord",
  "base16/nova",
  "base16/ocean",
  "base16/oceanicnext",
  "base16/one-light",
  "base16/onedark",
  "base16/outrun-dark",
  "base16/papercolor-dark",
  "base16/papercolor-light",
  "base16/paraiso",
  "base16/pasque",
  "base16/phd",
  "base16/pico",
  "base16/pop",
  "base16/porple",
  "base16/qualia",
  "base16/railscasts",
  "base16/rebecca",
  "base16/ros-pine",
  "base16/ros-pine-dawn",
  "base16/ros-pine-moon",
  "base16/sagelight",
  "base16/sandcastle",
  "base16/seti-ui",
  "base16/shapeshifter",
  "base16/silk-dark",
  "base16/silk-light",
  "base16/snazzy",
  "base16/solar-flare",
  "base16/solar-flare-light",
  "base16/solarized-dark",
  "base16/solarized-light",
  "base16/spacemacs",
  "base16/summercamp",
  "base16/summerfruit-dark",
  "base16/summerfruit-light",
  "base16/synth-midnight-terminal-dark",
  "base16/synth-midnight-terminal-light",
  "base16/tango",
  "base16/tender",
  "base16/tomorrow",
  "base16/tomorrow-night",
  "base16/twilight",
  "base16/unikitty-dark",
  "base16/unikitty-light",
  "base16/vulcan",
  "base16/windows-10",
  "base16/windows-10-light",
  "base16/windows-95",
  "base16/windows-95-light",
  "base16/windows-high-contrast",
  "base16/windows-high-contrast-light",
  "base16/windows-nt",
  "base16/windows-nt-light",
  "base16/woodland",
  "base16/xcode-dusk",
  "base16/zenburn",
  "a11y-dark",
  "a11y-light",
  "agate",
  "an-old-hope",
  "androidstudio",
  "arduino-light",
  "arta",
  "ascetic",
  "atom-one-dark",
  "atom-one-dark-reasonable",
  "atom-one-light",
  "brown-paper",
  "codepen-embed",
  "color-brewer",
  "dark",
  "default",
  "devibeans",
  "docco",
  "far",
  "foundation",
  "github",
  "github-dark",
  "github-dark-dimmed",
  "gml",
  "googlecode",
  "gradient-dark",
  "gradient-light",
  "grayscale",
  "hybrid",
  "idea",
  "ir-black",
  "isbl-editor-dark",
  "isbl-editor-light",
  "kimbie-dark",
  "kimbie-light",
  "lightfair",
  "lioshi",
  "magula",
  "mono-blue",
  "monokai",
  "monokai-sublime",
  "night-owl",
  "nnfx-dark",
  "nnfx-light",
  "nord",
  "obsidian",
  "paraiso-dark",
  "paraiso-light",
  "pojoaque",
  "purebasic",
  "qtcreator-dark",
  "qtcreator-light",
  "rainbow",
  "routeros",
  "school-book",
  "shades-of-purple",
  "srcery",
  "stackoverflow-dark",
  "stackoverflow-light",
  "sunburst",
  "tomorrow-night-blue",
  "tomorrow-night-bright",
  "vs",
  "vs2015",
  "xcode",
  "xt256"
];
var hljsCss = {
  defaultSource,
  defaultVersion,
  supportSources,
  styles
};
const DATA_CODE_KEY = "data-code-key";
const DATA_SELECTOR_KEY = "data-selector-key";
const DATA_LINE_START = "data-line-start";
const DATA_LINE_END = "data-line-end";
function ShowLine(md) {
  function show(state) {
    state.tokens.forEach((token) => {
      function eachLine(token2) {
        if (token2.children) {
          token2.children.forEach((child2, i2) => {
            if (token2.map) {
              child2.map = [token2.map[0] + i2, token2.map[0] + i2 + 1];
            }
            eachLine(child2);
          });
        } else if (token2.map) {
          const start = [DATA_LINE_START, token2.map[0].toString()];
          const end2 = [DATA_LINE_END, token2.map[1].toString()];
          token2.attrs = token2.attrs || [];
          token2.attrs.push(start, end2);
        }
      }
      eachLine(token);
    });
    return true;
  }
  md.core.ruler.push("show-line-rule", show);
  md.core.ruler.before("show-line-rule", "code", show);
}
const cssKeys = hljsCss.styles;
let id = 0;
const hljs = window.hljs;
const MarkdownIt = window.markdownit;
const markdown$1 = MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
  typographer: true,
  highlight: function(str, lang, attrs) {
    var _a;
    if (lang && hljs.getLanguage(lang)) {
      try {
        const value = hljs.highlight(lang, str, true).value;
        const selectOptions = cssKeys.map((k) => `<option  ${k === "github-dark" ? "selected" : ""}  value="${k}">${k}</option>`);
        const count = (_a = str.match(/\n/g)) == null ? void 0 : _a.length;
        const arr = Array.from(new Array(count)).map((v2, i2) => `<div>${i2 + 1}</div>`);
        return `<div class="markdown-code" ${DATA_CODE_KEY}="${id}"><div><div class="line-suffix hljs"><span class="code-css-selector"><select  ${DATA_SELECTOR_KEY}="${id++}">${selectOptions.join("")}</select></span><span class="code-copy">\u590D\u5236</span><span class="code-lang">${lang}</span></div><div class="block-code"><code class="hljs"><div class="line-count">${arr.join("")}</div><div class="code-render">${value}</div></code></div></div></div>`;
      } catch (__) {
      }
    }
    return `<pre class="hljs"><code>${markdown$1.utils.escapeHtml(str)}</code></pre>`;
  }
});
markdown$1.use(markdownItEmoji).use(Container).use(b, {
  permalink: true,
  permalinkBefore: true,
  permalinkSymbol: "#"
}).use(TocDoneRight, {
  itemClass: "toc-li",
  listType: "ul"
}).use(ShowLine);
var HljsStyleEnums;
(function(HljsStyleEnums2) {
  HljsStyleEnums2["base16/3024"] = "base16/3024";
  HljsStyleEnums2["base16/apathy"] = "base16/apathy";
  HljsStyleEnums2["base16/apprentice"] = "base16/apprentice";
  HljsStyleEnums2["base16/ashes"] = "base16/ashes";
  HljsStyleEnums2["base16/atelier-cave"] = "base16/atelier-cave";
  HljsStyleEnums2["base16/atelier-cave-light"] = "base16/atelier-cave-light";
  HljsStyleEnums2["base16/atelier-dune"] = "base16/atelier-dune";
  HljsStyleEnums2["base16/atelier-dune-light"] = "base16/atelier-dune-light";
  HljsStyleEnums2["base16/atelier-estuary"] = "base16/atelier-estuary";
  HljsStyleEnums2["base16/atelier-estuary-light"] = "base16/atelier-estuary-light";
  HljsStyleEnums2["base16/atelier-forest"] = "base16/atelier-forest";
  HljsStyleEnums2["base16/atelier-forest-light"] = "base16/atelier-forest-light";
  HljsStyleEnums2["base16/atelier-heath"] = "base16/atelier-heath";
  HljsStyleEnums2["base16/atelier-heath-light"] = "base16/atelier-heath-light";
  HljsStyleEnums2["base16/atelier-lakeside"] = "base16/atelier-lakeside";
  HljsStyleEnums2["base16/atelier-lakeside-light"] = "base16/atelier-lakeside-light";
  HljsStyleEnums2["base16/atelier-plateau"] = "base16/atelier-plateau";
  HljsStyleEnums2["base16/atelier-plateau-light"] = "base16/atelier-plateau-light";
  HljsStyleEnums2["base16/atelier-savanna"] = "base16/atelier-savanna";
  HljsStyleEnums2["base16/atelier-savanna-light"] = "base16/atelier-savanna-light";
  HljsStyleEnums2["base16/atelier-seaside"] = "base16/atelier-seaside";
  HljsStyleEnums2["base16/atelier-seaside-light"] = "base16/atelier-seaside-light";
  HljsStyleEnums2["base16/atelier-sulphurpool"] = "base16/atelier-sulphurpool";
  HljsStyleEnums2["base16/atelier-sulphurpool-light"] = "base16/atelier-sulphurpool-light";
  HljsStyleEnums2["base16/atlas"] = "base16/atlas";
  HljsStyleEnums2["base16/bespin"] = "base16/bespin";
  HljsStyleEnums2["base16/black-metal"] = "base16/black-metal";
  HljsStyleEnums2["base16/black-metal-bathory"] = "base16/black-metal-bathory";
  HljsStyleEnums2["base16/black-metal-burzum"] = "base16/black-metal-burzum";
  HljsStyleEnums2["base16/black-metal-dark-funeral"] = "base16/black-metal-dark-funeral";
  HljsStyleEnums2["base16/black-metal-gorgoroth"] = "base16/black-metal-gorgoroth";
  HljsStyleEnums2["base16/black-metal-immortal"] = "base16/black-metal-immortal";
  HljsStyleEnums2["base16/black-metal-khold"] = "base16/black-metal-khold";
  HljsStyleEnums2["base16/black-metal-marduk"] = "base16/black-metal-marduk";
  HljsStyleEnums2["base16/black-metal-mayhem"] = "base16/black-metal-mayhem";
  HljsStyleEnums2["base16/black-metal-nile"] = "base16/black-metal-nile";
  HljsStyleEnums2["base16/black-metal-venom"] = "base16/black-metal-venom";
  HljsStyleEnums2["base16/brewer"] = "base16/brewer";
  HljsStyleEnums2["base16/bright"] = "base16/bright";
  HljsStyleEnums2["base16/brogrammer"] = "base16/brogrammer";
  HljsStyleEnums2["base16/brush-trees"] = "base16/brush-trees";
  HljsStyleEnums2["base16/brush-trees-dark"] = "base16/brush-trees-dark";
  HljsStyleEnums2["base16/chalk"] = "base16/chalk";
  HljsStyleEnums2["base16/circus"] = "base16/circus";
  HljsStyleEnums2["base16/classic-dark"] = "base16/classic-dark";
  HljsStyleEnums2["base16/classic-light"] = "base16/classic-light";
  HljsStyleEnums2["base16/codeschool"] = "base16/codeschool";
  HljsStyleEnums2["base16/colors"] = "base16/colors";
  HljsStyleEnums2["base16/cupcake"] = "base16/cupcake";
  HljsStyleEnums2["base16/cupertino"] = "base16/cupertino";
  HljsStyleEnums2["base16/danqing"] = "base16/danqing";
  HljsStyleEnums2["base16/darcula"] = "base16/darcula";
  HljsStyleEnums2["base16/dark-violet"] = "base16/dark-violet";
  HljsStyleEnums2["base16/darkmoss"] = "base16/darkmoss";
  HljsStyleEnums2["base16/darktooth"] = "base16/darktooth";
  HljsStyleEnums2["base16/decaf"] = "base16/decaf";
  HljsStyleEnums2["base16/default-dark"] = "base16/default-dark";
  HljsStyleEnums2["base16/default-light"] = "base16/default-light";
  HljsStyleEnums2["base16/dirtysea"] = "base16/dirtysea";
  HljsStyleEnums2["base16/dracula"] = "base16/dracula";
  HljsStyleEnums2["base16/edge-dark"] = "base16/edge-dark";
  HljsStyleEnums2["base16/edge-light"] = "base16/edge-light";
  HljsStyleEnums2["base16/eighties"] = "base16/eighties";
  HljsStyleEnums2["base16/embers"] = "base16/embers";
  HljsStyleEnums2["base16/equilibrium-dark"] = "base16/equilibrium-dark";
  HljsStyleEnums2["base16/equilibrium-gray-dark"] = "base16/equilibrium-gray-dark";
  HljsStyleEnums2["base16/equilibrium-gray-light"] = "base16/equilibrium-gray-light";
  HljsStyleEnums2["base16/equilibrium-light"] = "base16/equilibrium-light";
  HljsStyleEnums2["base16/espresso"] = "base16/espresso";
  HljsStyleEnums2["base16/eva"] = "base16/eva";
  HljsStyleEnums2["base16/eva-dim"] = "base16/eva-dim";
  HljsStyleEnums2["base16/flat"] = "base16/flat";
  HljsStyleEnums2["base16/framer"] = "base16/framer";
  HljsStyleEnums2["base16/fruit-soda"] = "base16/fruit-soda";
  HljsStyleEnums2["base16/gigavolt"] = "base16/gigavolt";
  HljsStyleEnums2["base16/github"] = "base16/github";
  HljsStyleEnums2["base16/google-dark"] = "base16/google-dark";
  HljsStyleEnums2["base16/google-light"] = "base16/google-light";
  HljsStyleEnums2["base16/grayscale-dark"] = "base16/grayscale-dark";
  HljsStyleEnums2["base16/grayscale-light"] = "base16/grayscale-light";
  HljsStyleEnums2["base16/green-screen"] = "base16/green-screen";
  HljsStyleEnums2["base16/gruvbox-dark-hard"] = "base16/gruvbox-dark-hard";
  HljsStyleEnums2["base16/gruvbox-dark-medium"] = "base16/gruvbox-dark-medium";
  HljsStyleEnums2["base16/gruvbox-dark-pale"] = "base16/gruvbox-dark-pale";
  HljsStyleEnums2["base16/gruvbox-dark-soft"] = "base16/gruvbox-dark-soft";
  HljsStyleEnums2["base16/gruvbox-light-hard"] = "base16/gruvbox-light-hard";
  HljsStyleEnums2["base16/gruvbox-light-medium"] = "base16/gruvbox-light-medium";
  HljsStyleEnums2["base16/gruvbox-light-soft"] = "base16/gruvbox-light-soft";
  HljsStyleEnums2["base16/hardcore"] = "base16/hardcore";
  HljsStyleEnums2["base16/harmonic16-dark"] = "base16/harmonic16-dark";
  HljsStyleEnums2["base16/harmonic16-light"] = "base16/harmonic16-light";
  HljsStyleEnums2["base16/heetch-dark"] = "base16/heetch-dark";
  HljsStyleEnums2["base16/heetch-light"] = "base16/heetch-light";
  HljsStyleEnums2["base16/helios"] = "base16/helios";
  HljsStyleEnums2["base16/hopscotch"] = "base16/hopscotch";
  HljsStyleEnums2["base16/horizon-dark"] = "base16/horizon-dark";
  HljsStyleEnums2["base16/horizon-light"] = "base16/horizon-light";
  HljsStyleEnums2["base16/humanoid-dark"] = "base16/humanoid-dark";
  HljsStyleEnums2["base16/humanoid-light"] = "base16/humanoid-light";
  HljsStyleEnums2["base16/ia-dark"] = "base16/ia-dark";
  HljsStyleEnums2["base16/ia-light"] = "base16/ia-light";
  HljsStyleEnums2["base16/icy-dark"] = "base16/icy-dark";
  HljsStyleEnums2["base16/ir-black"] = "base16/ir-black";
  HljsStyleEnums2["base16/isotope"] = "base16/isotope";
  HljsStyleEnums2["base16/kimber"] = "base16/kimber";
  HljsStyleEnums2["base16/london-tube"] = "base16/london-tube";
  HljsStyleEnums2["base16/macintosh"] = "base16/macintosh";
  HljsStyleEnums2["base16/marrakesh"] = "base16/marrakesh";
  HljsStyleEnums2["base16/materia"] = "base16/materia";
  HljsStyleEnums2["base16/material"] = "base16/material";
  HljsStyleEnums2["base16/material-darker"] = "base16/material-darker";
  HljsStyleEnums2["base16/material-lighter"] = "base16/material-lighter";
  HljsStyleEnums2["base16/material-palenight"] = "base16/material-palenight";
  HljsStyleEnums2["base16/material-vivid"] = "base16/material-vivid";
  HljsStyleEnums2["base16/mellow-purple"] = "base16/mellow-purple";
  HljsStyleEnums2["base16/mexico-light"] = "base16/mexico-light";
  HljsStyleEnums2["base16/mocha"] = "base16/mocha";
  HljsStyleEnums2["base16/monokai"] = "base16/monokai";
  HljsStyleEnums2["base16/nebula"] = "base16/nebula";
  HljsStyleEnums2["base16/nord"] = "base16/nord";
  HljsStyleEnums2["base16/nova"] = "base16/nova";
  HljsStyleEnums2["base16/ocean"] = "base16/ocean";
  HljsStyleEnums2["base16/oceanicnext"] = "base16/oceanicnext";
  HljsStyleEnums2["base16/one-light"] = "base16/one-light";
  HljsStyleEnums2["base16/onedark"] = "base16/onedark";
  HljsStyleEnums2["base16/outrun-dark"] = "base16/outrun-dark";
  HljsStyleEnums2["base16/papercolor-dark"] = "base16/papercolor-dark";
  HljsStyleEnums2["base16/papercolor-light"] = "base16/papercolor-light";
  HljsStyleEnums2["base16/paraiso"] = "base16/paraiso";
  HljsStyleEnums2["base16/pasque"] = "base16/pasque";
  HljsStyleEnums2["base16/phd"] = "base16/phd";
  HljsStyleEnums2["base16/pico"] = "base16/pico";
  HljsStyleEnums2["base16/pop"] = "base16/pop";
  HljsStyleEnums2["base16/porple"] = "base16/porple";
  HljsStyleEnums2["base16/qualia"] = "base16/qualia";
  HljsStyleEnums2["base16/railscasts"] = "base16/railscasts";
  HljsStyleEnums2["base16/rebecca"] = "base16/rebecca";
  HljsStyleEnums2["base16/ros-pine"] = "base16/ros-pine";
  HljsStyleEnums2["base16/ros-pine-dawn"] = "base16/ros-pine-dawn";
  HljsStyleEnums2["base16/ros-pine-moon"] = "base16/ros-pine-moon";
  HljsStyleEnums2["base16/sagelight"] = "base16/sagelight";
  HljsStyleEnums2["base16/sandcastle"] = "base16/sandcastle";
  HljsStyleEnums2["base16/seti-ui"] = "base16/seti-ui";
  HljsStyleEnums2["base16/shapeshifter"] = "base16/shapeshifter";
  HljsStyleEnums2["base16/silk-dark"] = "base16/silk-dark";
  HljsStyleEnums2["base16/silk-light"] = "base16/silk-light";
  HljsStyleEnums2["base16/snazzy"] = "base16/snazzy";
  HljsStyleEnums2["base16/solar-flare"] = "base16/solar-flare";
  HljsStyleEnums2["base16/solar-flare-light"] = "base16/solar-flare-light";
  HljsStyleEnums2["base16/solarized-dark"] = "base16/solarized-dark";
  HljsStyleEnums2["base16/solarized-light"] = "base16/solarized-light";
  HljsStyleEnums2["base16/spacemacs"] = "base16/spacemacs";
  HljsStyleEnums2["base16/summercamp"] = "base16/summercamp";
  HljsStyleEnums2["base16/summerfruit-dark"] = "base16/summerfruit-dark";
  HljsStyleEnums2["base16/summerfruit-light"] = "base16/summerfruit-light";
  HljsStyleEnums2["base16/synth-midnight-terminal-dark"] = "base16/synth-midnight-terminal-dark";
  HljsStyleEnums2["base16/synth-midnight-terminal-light"] = "base16/synth-midnight-terminal-light";
  HljsStyleEnums2["base16/tango"] = "base16/tango";
  HljsStyleEnums2["base16/tender"] = "base16/tender";
  HljsStyleEnums2["base16/tomorrow"] = "base16/tomorrow";
  HljsStyleEnums2["base16/tomorrow-night"] = "base16/tomorrow-night";
  HljsStyleEnums2["base16/twilight"] = "base16/twilight";
  HljsStyleEnums2["base16/unikitty-dark"] = "base16/unikitty-dark";
  HljsStyleEnums2["base16/unikitty-light"] = "base16/unikitty-light";
  HljsStyleEnums2["base16/vulcan"] = "base16/vulcan";
  HljsStyleEnums2["base16/windows-10"] = "base16/windows-10";
  HljsStyleEnums2["base16/windows-10-light"] = "base16/windows-10-light";
  HljsStyleEnums2["base16/windows-95"] = "base16/windows-95";
  HljsStyleEnums2["base16/windows-95-light"] = "base16/windows-95-light";
  HljsStyleEnums2["base16/windows-high-contrast"] = "base16/windows-high-contrast";
  HljsStyleEnums2["base16/windows-high-contrast-light"] = "base16/windows-high-contrast-light";
  HljsStyleEnums2["base16/windows-nt"] = "base16/windows-nt";
  HljsStyleEnums2["base16/windows-nt-light"] = "base16/windows-nt-light";
  HljsStyleEnums2["base16/woodland"] = "base16/woodland";
  HljsStyleEnums2["base16/xcode-dusk"] = "base16/xcode-dusk";
  HljsStyleEnums2["base16/zenburn"] = "base16/zenburn";
  HljsStyleEnums2["a11y-dark"] = "a11y-dark";
  HljsStyleEnums2["a11y-light"] = "a11y-light";
  HljsStyleEnums2["agate"] = "agate";
  HljsStyleEnums2["an-old-hope"] = "an-old-hope";
  HljsStyleEnums2["androidstudio"] = "androidstudio";
  HljsStyleEnums2["arduino-light"] = "arduino-light";
  HljsStyleEnums2["arta"] = "arta";
  HljsStyleEnums2["ascetic"] = "ascetic";
  HljsStyleEnums2["atom-one-dark"] = "atom-one-dark";
  HljsStyleEnums2["atom-one-dark-reasonable"] = "atom-one-dark-reasonable";
  HljsStyleEnums2["atom-one-light"] = "atom-one-light";
  HljsStyleEnums2["brown-paper"] = "brown-paper";
  HljsStyleEnums2["codepen-embed"] = "codepen-embed";
  HljsStyleEnums2["color-brewer"] = "color-brewer";
  HljsStyleEnums2["dark"] = "dark";
  HljsStyleEnums2["default"] = "default";
  HljsStyleEnums2["devibeans"] = "devibeans";
  HljsStyleEnums2["docco"] = "docco";
  HljsStyleEnums2["far"] = "far";
  HljsStyleEnums2["foundation"] = "foundation";
  HljsStyleEnums2["github"] = "github";
  HljsStyleEnums2["github-dark"] = "github-dark";
  HljsStyleEnums2["github-dark-dimmed"] = "github-dark-dimmed";
  HljsStyleEnums2["gml"] = "gml";
  HljsStyleEnums2["googlecode"] = "googlecode";
  HljsStyleEnums2["gradient-dark"] = "gradient-dark";
  HljsStyleEnums2["gradient-light"] = "gradient-light";
  HljsStyleEnums2["grayscale"] = "grayscale";
  HljsStyleEnums2["hybrid"] = "hybrid";
  HljsStyleEnums2["idea"] = "idea";
  HljsStyleEnums2["ir-black"] = "ir-black";
  HljsStyleEnums2["isbl-editor-dark"] = "isbl-editor-dark";
  HljsStyleEnums2["isbl-editor-light"] = "isbl-editor-light";
  HljsStyleEnums2["kimbie-dark"] = "kimbie-dark";
  HljsStyleEnums2["kimbie-light"] = "kimbie-light";
  HljsStyleEnums2["lightfair"] = "lightfair";
  HljsStyleEnums2["lioshi"] = "lioshi";
  HljsStyleEnums2["magula"] = "magula";
  HljsStyleEnums2["mono-blue"] = "mono-blue";
  HljsStyleEnums2["monokai"] = "monokai";
  HljsStyleEnums2["monokai-sublime"] = "monokai-sublime";
  HljsStyleEnums2["night-owl"] = "night-owl";
  HljsStyleEnums2["nnfx-dark"] = "nnfx-dark";
  HljsStyleEnums2["nnfx-light"] = "nnfx-light";
  HljsStyleEnums2["nord"] = "nord";
  HljsStyleEnums2["obsidian"] = "obsidian";
  HljsStyleEnums2["paraiso-dark"] = "paraiso-dark";
  HljsStyleEnums2["paraiso-light"] = "paraiso-light";
  HljsStyleEnums2["pojoaque"] = "pojoaque";
  HljsStyleEnums2["purebasic"] = "purebasic";
  HljsStyleEnums2["qtcreator-dark"] = "qtcreator-dark";
  HljsStyleEnums2["qtcreator-light"] = "qtcreator-light";
  HljsStyleEnums2["rainbow"] = "rainbow";
  HljsStyleEnums2["routeros"] = "routeros";
  HljsStyleEnums2["school-book"] = "school-book";
  HljsStyleEnums2["shades-of-purple"] = "shades-of-purple";
  HljsStyleEnums2["srcery"] = "srcery";
  HljsStyleEnums2["stackoverflow-dark"] = "stackoverflow-dark";
  HljsStyleEnums2["stackoverflow-light"] = "stackoverflow-light";
  HljsStyleEnums2["sunburst"] = "sunburst";
  HljsStyleEnums2["tomorrow-night-blue"] = "tomorrow-night-blue";
  HljsStyleEnums2["tomorrow-night-bright"] = "tomorrow-night-bright";
  HljsStyleEnums2["vs"] = "vs";
  HljsStyleEnums2["vs2015"] = "vs2015";
  HljsStyleEnums2["xcode"] = "xcode";
  HljsStyleEnums2["xt256"] = "xt256";
})(HljsStyleEnums || (HljsStyleEnums = {}));
var HljsStyleEnums$1 = HljsStyleEnums;
function resolveRaw(render2) {
  let html = (render2 == null ? void 0 : render2.querySelector("pre").innerHTML) || (render2 == null ? void 0 : render2.innerHTML);
  html = formatPreElementContent(html);
  return markdown$1.render(html || "");
}
let temp_offsetHeight = -1;
function scrollToLine(target, change_line) {
  const els = Array.from(document.querySelectorAll(`[${DATA_LINE_START}]`));
  for (const el of els) {
    const start = el.dataset.lineStart;
    const end2 = el.dataset.lineEnd;
    if (start <= change_line && change_line <= end2 && temp_offsetHeight !== (el == null ? void 0 : el.offsetTop)) {
      temp_offsetHeight = el == null ? void 0 : el.offsetTop;
      target.scrollTo({
        behavior: "smooth",
        top: (el == null ? void 0 : el.offsetTop) > target.offsetHeight ? (el == null ? void 0 : el.offsetTop) - target.offsetHeight / 2 : 0
      });
      return true;
    }
  }
  return false;
}
function formatPreElementContent(content) {
  let res = content;
  let tabInfo = [];
  let min = 0;
  res = res.split("\n");
  res.forEach((line, i2) => {
    var _a, _b;
    if (line.replace(/\s+/g, "") !== "") {
      tabInfo.push({
        count: ((_b = (_a = line.match(/^(    |\t)+/g)) == null ? void 0 : _a[0].match(/(    |\t)/g)) == null ? void 0 : _b.length) || 0,
        index: i2
      });
    }
  });
  console.log("tabCount", tabInfo);
  min = minCount(tabInfo.map((t2) => t2.count));
  tabInfo.forEach((info) => {
    res[info.index] = "	".repeat(info.count - min) + res[info.index].replace(/(    |\t)+/g, "");
  });
  res = res.join("\n");
  function minCount(arr) {
    let base = arr[0];
    for (let i2 = 1; i2 < arr.length; i2++) {
      base = Math.min(base, arr[i2]);
    }
    return base;
  }
  return res;
}
function autoChangeStyle(render2) {
  const selects = Array.from(render2.querySelectorAll("[" + DATA_SELECTOR_KEY + "]"));
  if (selects.length !== 0) {
    selects.forEach((select) => {
      select.style.width = select.value.length * 6 + 40 + "px";
      select.onchange = function(e2) {
        select.style.width = select.value.length * 6 + 40 + "px";
        changeStyle(select);
      };
    });
  }
}
function contentCopy(content, render2, copyHandler) {
  const codes = Array.from(render2.querySelectorAll("[class*=language]"));
  codes.forEach((code) => {
    const codeRender = code.querySelector(".code-render");
    const copyEl = code.querySelector(".code-copy");
    copyEl.onclick = function() {
      navigator.clipboard.writeText(codeRender.innerText);
      copyHandler == null ? void 0 : copyHandler(codeRender.innerText);
    };
  });
}
function changeStyle(select) {
  var _a, _b;
  const key2 = select.getAttribute(DATA_SELECTOR_KEY);
  const list = (_a = document.querySelector(`[${DATA_CODE_KEY}="${key2}"]`)) == null ? void 0 : _a.classList;
  const classes = (_b = list == null ? void 0 : list.value) == null ? void 0 : _b.split(" ");
  if (classes == null ? void 0 : classes.some((c2) => /hl-/.test(c2))) {
    list == null ? void 0 : list.remove((classes == null ? void 0 : classes.find((c2) => /hl-/.test(c2))) || "");
  }
  list == null ? void 0 : list.add("hl-" + select.value.replace("/", "-"));
}
const MdRender = vue.defineComponent({
  name: "MdRender",
  props: {
    content: {
      type: String,
      default: "",
      required: false
    },
    codeStyle: {
      type: String,
      default: HljsStyleEnums$1["github-dark"],
      required: false
    },
    raw: {
      type: Boolean,
      default: false,
      required: false
    }
  },
  emits: ["copy"],
  setup(props, {
    slots,
    emit
  }) {
    var _a;
    const {
      content,
      codeStyle,
      raw
    } = vue.toRefs(props);
    let result = vue.ref("");
    let render2 = vue.ref(null);
    vue.onMounted(() => {
      toolResolve();
      vue.nextTick(() => {
        if (raw.value && render2.value) {
          const rawMD = resolveRaw(render2.value);
          result.value = rawMD;
          render2.value.innerHTML = rawMD;
        }
      });
    });
    vue.watch(result, () => {
      vue.nextTick(toolResolve);
    });
    function toolResolve() {
      autoChangeStyle(render2.value);
      contentCopy(content.value, render2.value, (value) => {
        emit("copy", value);
      });
    }
    let content_cache = ((_a = content.value) == null ? void 0 : _a.split("\n")) || [];
    let temp_line = -1;
    vue.watch(content, () => {
      vue.nextTick(() => {
        var _a2, _b;
        if (!raw.value) {
          result.value = markdown$1.render((content == null ? void 0 : content.value) || "");
        }
        if (render2.value) {
          render2.value.innerHTML = result.value;
          const lines = ((_a2 = content == null ? void 0 : content.value) == null ? void 0 : _a2.split("\n")) || [];
          for (let i2 = 0; i2 < lines.length; i2++) {
            if (lines[i2] != content_cache[i2] && temp_line !== i2) {
              temp_line = i2;
              scrollToLine(render2.value, i2);
              break;
            }
          }
          content_cache = ((_b = content == null ? void 0 : content.value) == null ? void 0 : _b.split("\n")) || [];
        }
      });
    });
    return () => {
      var _a2;
      return vue.createVNode("div", {
        "ref": render2,
        "class": "markdown-body hl-" + codeStyle.value.toString().replace("/", "-")
      }, [raw.value ? (_a2 = slots.default) == null ? void 0 : _a2.call(slots) : vue.createVNode("div", {
        "innerHTML": result.value
      }, null)]);
    };
  }
});
var markdown = "/**\r\n    markdown \u6837\u5F0F\r\n*/\r\n.markdown-body {\r\n    /**\r\n          \u4EE5\u4E0B\u662F table \u6837\u5F0F\r\n      */\r\n  }\r\n  .markdown-body img {\r\n    max-width: 100%;\r\n  }\r\n  .markdown-body pre {\r\n    max-width: 100%;\r\n  }\r\n  .markdown-body details {\r\n    border-radius: 2px;\r\n    padding: 30px 0px 30px 20px;\r\n    border-left: 8px solid rgba(0, 0, 0, 0.25);\r\n    background-color: rgba(222, 222, 222, 0.115);\r\n  }\r\n  .markdown-body h1 code,\r\n  .markdown-body h2 code,\r\n  .markdown-body h3 code,\r\n  .markdown-body h4 code,\r\n  .markdown-body h5 code,\r\n  .markdown-body h6 code {\r\n    padding: 0.4rem 0.6rem;\r\n    background-color: #f0f0f0;\r\n    border-radius: 6px;\r\n    font-size: 1.5rem;\r\n    font-weight: bold;\r\n    font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;\r\n  }\r\n  .markdown-body h1:hover .header-anchor,\r\n  .markdown-body h2:hover .header-anchor,\r\n  .markdown-body h3:hover .header-anchor,\r\n  .markdown-body h4:hover .header-anchor,\r\n  .markdown-body h5:hover .header-anchor,\r\n  .markdown-body h6:hover .header-anchor {\r\n    text-decoration: none;\r\n    display: inline-block;\r\n  }\r\n  .markdown-body p code,\r\n  .markdown-body a code,\r\n  .markdown-body span code,\r\n  .markdown-body li code {\r\n    padding: 0.1rem 0.4rem;\r\n    color: #c7254e;\r\n    background-color: #f9f2f4;\r\n    border-radius: 4px;\r\n    font-family: 'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', 'Lucida Sans', Arial, sans-serif;\r\n  }\r\n  .markdown-body pre:not([class]) > code:not([class]) {\r\n    display: block;\r\n    padding: 20px;\r\n    background-color: #f0f0f0;\r\n    font-family: monospace;\r\n    margin: 0px;\r\n    max-width: 100%;\r\n  }\r\n  .markdown-body pre.hljs {\r\n    padding: 20px;\r\n  }\r\n  .markdown-body .markdown-code:hover .line-suffix {\r\n    opacity: 1;\r\n  }\r\n  .markdown-body .markdown-code .line-suffix {\r\n    display: flex;\r\n    width: 100%;\r\n    justify-content: flex-end;\r\n    transform: translate(0, 24px);\r\n    transition: all ease 0.5s;\r\n    opacity: 0;\r\n  }\r\n  .markdown-body .markdown-code .line-suffix select {\r\n    border: unset;\r\n    color: #ffffff;\r\n    background: unset;\r\n  }\r\n  .markdown-body .markdown-code .line-suffix select option {\r\n    text-align: left;\r\n    color: black;\r\n  }\r\n  .markdown-body .markdown-code .line-suffix [class*=code] {\r\n    line-height: 18px;\r\n    color: #ffffff;\r\n    background-color: rgba(0, 0, 0, 0.2);\r\n    padding: 0px 4px;\r\n    margin: 0px 10px 0px 10px;\r\n    border-radius: 4px;\r\n    cursor: pointer;\r\n    -moz-user-select: none;\r\n    -webkit-user-select: none;\r\n    -ms-user-select: none;\r\n    -khtml-user-select: none;\r\n    user-select: none;\r\n  }\r\n  .markdown-body .markdown-code .block-code code {\r\n    transition: all ease 0.5s;\r\n    padding-top: 10px;\r\n    display: flex;\r\n  }\r\n  .markdown-body .markdown-code .block-code code .line-count {\r\n    margin: 5px;\r\n    padding: 15px;\r\n    color: #9e9e9e;\r\n    border-right: 1px solid #000000;\r\n    -moz-user-select: none;\r\n    -webkit-user-select: none;\r\n    -ms-user-select: none;\r\n    -khtml-user-select: none;\r\n    user-select: none;\r\n  }\r\n  .markdown-body .markdown-code .block-code code .code-render {\r\n    width: 100%;\r\n    padding: 20px;\r\n    padding-bottom: 10px;\r\n    overflow: auto;\r\n    font-family: Consolas,Monaco,Andale Mono,Ubuntu Mono,monospace;\r\n  }\r\n  .markdown-body .header-anchor {\r\n    display: none;\r\n  }\r\n  .markdown-body ::selection {\r\n    color: white;\r\n    background-color: #3368f4;\r\n  }\r\n  .markdown-body blockquote {\r\n    border-radius: 2px;\r\n    padding: 4px 0px 4px 20px;\r\n    margin: 0px;\r\n    font-size: 14px;\r\n    color: rgba(0, 0, 0, 0.65);\r\n    border-left: 8px solid rgba(0, 0, 0, 0.25);\r\n    background-color: rgba(222, 222, 222, 0.115);\r\n  }\r\n  .markdown-body table {\r\n    border-spacing: 0px;\r\n    text-indent: unset;\r\n    box-sizing: unset;\r\n    border-collapse: unset;\r\n  }\r\n  .markdown-body table tr th {\r\n    font-weight: 700;\r\n    background-color: #e5e7eb;\r\n  }\r\n  .markdown-body table tr:nth-child(even) {\r\n    background-color: #f5f5f5;\r\n  }\r\n  .markdown-body th,\r\n  .markdown-body td {\r\n    border: 1px solid #ddd;\r\n    padding: 10px;\r\n  }\r\n  .markdown-body hr {\r\n    background: #e8e8e8;\r\n    margin: 24px 0px 24px 0px;\r\n    padding: 0px;\r\n    border: unset;\r\n    height: 1.5px;\r\n  }\r\n  .markdown-body a::selection {\r\n    color: blue;\r\n  }\r\n  .markdown-body a {\r\n    color: #2f9bff;\r\n  }\r\n  .markdown-body ul {\r\n    padding-inline-start: 32px;\r\n  }\r\n  .markdown-body ul li {\r\n    line-height: 26px;\r\n  }\r\n  .markdown-body .toc-li {\r\n    display: block;\r\n  }";
function MarkUI(app, ...options) {
  app.component("MdRender", MdRender);
  app.component("MdEditor", MdEditor);
}
exports.HljsStyleEnums = HljsStyleEnums$1;
exports.MdEditor = MdEditor;
exports.MdRender = MdRender;
exports["default"] = MarkUI;
