import {
  Serialize,
  Id,
  TempId,
  ArrayOf,
  Serializable,
  deserialize,
} from "./serializable";

@Serializable
class User {
  @Id
  id!: number;

  @Serialize
  name!: string;

  @Serialize
  age?: number;

  password?: string;
}

@Serializable
class Admin extends User {
  @Serialize
  role: string = "admin";
}

@Serializable
class Comment {
  @TempId
  tempId?: string;

  @Id
  id?: number;

  @Serialize
  text!: string;

  @Serialize
  author?: User;
}

@Serializable
class Post {
  @Id
  id!: number;

  @Serialize
  title!: string;

  @Serialize
  author!: User;

  @Serialize
  @ArrayOf(Comment)
  comments: Comment[] = [];
}

@Serializable
class Article {
  @Id
  id!: number;

  @Serialize
  content!: string;

  internalState: any;
}

describe("Serialization", () => {
  test("@Serialize marks properties for output", () => {
    const user = new User();
    user.id = 1;
    user.name = "Alice";
    user.age = 30;
    user.password = "secret";

    const json = JSON.parse(JSON.stringify(user));
    expect(json).toEqual({
      id: 1,
      name: "Alice",
      age: 30,
    });
    expect(json).not.toHaveProperty("password");
  });

  test("@Id also adds property to whitelist", () => {
    const user = new User();
    user.id = 42;
    user.name = "Bob";
    const json = JSON.parse(JSON.stringify(user));
    expect(json).toHaveProperty("id", 42);
  });

  test("@TempId adds property to whitelist but is not kept after deserialization", () => {
    const comment = new Comment();
    comment.tempId = "t123";
    comment.id = 5;
    comment.text = "test";

    const json = JSON.parse(JSON.stringify(comment));
    expect(json).toHaveProperty("tempId", "t123");

    const fresh = new Comment();
    fresh.id = 5;

    const deserialized = deserialize(fresh, json);
    expect(deserialized.tempId).toBeUndefined();
    expect(deserialized.id).toBe(5);
    expect(deserialized.text).toBe("test");
  });

  test("@Serializable handles inheritance", () => {
    const admin = new Admin();
    admin.id = 10;
    admin.name = "Eve";
    admin.role = "superuser";
    admin.password = "admin123";

    const json = JSON.parse(JSON.stringify(admin));
    expect(json).toEqual({
      id: 10,
      name: "Eve",
      role: "superuser",
    });
  });
});

describe("Deserialization – Basic", () => {
  test("deserialize merges into existing target (in‑place mutation)", () => {
    const existing = new User();
    existing.id = 1;
    existing.name = "OldName";
    existing.age = 30;

    const data = {
      id: 1,
      name: "NewName",
    };

    const result = deserialize(existing, data);
    expect(result).toBe(existing);
    expect(existing.name).toBe("NewName");
    expect(existing.age).toBe(30);
  });

  test("deserialize ignores non‑whitelisted properties", () => {
    const user = new User();
    user.id = 2;
    user.name = "Frank";

    const data = {
      id: 2,
      name: "Frank",
      password: "hackme",
    };
    const result = deserialize(user, data);
    expect(result.password).toBeUndefined();
  });

  test("deserialize handles nested objects when target already has the nested instance", () => {
    const author = new User();
    author.id = 10;
    author.name = "Grace";

    const post = new Post();
    post.id = 100;
    post.title = "Original";
    post.author = author;

    const data = {
      id: 100,
      title: "Updated Title",
      author: {
        id: 10,
        name: "Grace Updated",
      },
    };

    const result = deserialize(post, data);
    expect(result.author).toBe(author);
    expect(result.author.name).toBe("Grace Updated");
    expect(result.title).toBe("Updated Title");
  });

  test("deserialize creates nested object as plain object but leaves it empty when target property is missing", () => {
    const post = new Post();
    post.id = 200;
    post.title = "New Post";

    const data = {
      id: 200,
      title: "New Post",
      author: {
        id: 20,
        name: "Henry",
      },
    };

    const result = deserialize(post, data);
    expect(result).toBe(post);
    expect(result.author).not.toBeInstanceOf(User);
    expect(result.author.id).toBeUndefined();
    expect(result.author.name).toBeUndefined();
  });
});

describe("Deserialization – Arrays", () => {
  test("deserialize replaces entire array content (no ID matching)", () => {
    @Serializable
    class Item {
      @Serialize
      value!: string;
    }

    @Serializable
    class Bag {
      @Serialize
      @ArrayOf(Item)
      items: Item[] = [];
    }

    const bag = new Bag();
    const oldItem1 = new Item();
    oldItem1.value = "apple";
    const oldItem2 = new Item();
    oldItem2.value = "banana";
    bag.items = [oldItem1, oldItem2];

    const data = {
      items: [{ value: "cherry" }],
    };

    deserialize(bag, data);
    expect(bag.items).toHaveLength(1);
    expect(bag.items[0]).toBeInstanceOf(Item);
    expect(bag.items[0].value).toBe("cherry");
  });

  test("deserialize merges array items using @Id when available", () => {
    const existingUser = new User();
    existingUser.id = 1;
    existingUser.name = "Alice";

    const existingUser2 = new User();
    existingUser2.id = 2;
    existingUser2.name = "Bob";

    @Serializable
    class Group {
      @Serialize
      @ArrayOf(User)
      members: User[] = [existingUser, existingUser2];
    }

    const group = new Group();
    group.members = [existingUser, existingUser2];

    const data = {
      members: [
        { id: 1, name: "Alice Updated" },
        { id: 3, name: "Charlie" },
      ],
    };

    const result = deserialize(group, data);
    expect(result.members).toHaveLength(2);
    expect(result.members[0]).toBe(existingUser);
    expect(result.members[0].name).toBe("Alice Updated");
    expect(result.members[1]).toBeInstanceOf(User);
    expect(result.members[1].id).toBe(3);
    expect(result.members[1].name).toBe("Charlie");
  });

  test("deserialize merges array items using @TempId for matching", () => {
    const comment1 = new Comment();
    comment1.tempId = "t1";
    comment1.id = 101;
    comment1.text = "first";

    const comment2 = new Comment();
    comment2.tempId = "t2";
    comment2.id = 102;
    comment2.text = "second";

    @Serializable
    class Thread {
      @Serialize
      @ArrayOf(Comment)
      comments: Comment[] = [comment1, comment2];
    }

    const thread = new Thread();
    thread.comments = [comment1, comment2];

    const data = {
      comments: [
        { tempId: "t1", text: "first updated" },
        { tempId: "t3", text: "new comment" },
      ],
    };

    deserialize(thread, data);
    expect(thread.comments).toHaveLength(2);
    expect(thread.comments[0]).toBe(comment1);
    expect(thread.comments[0].text).toBe("first updated");
    expect(thread.comments[0].tempId).toBeUndefined();
    expect(thread.comments[1]).toBeInstanceOf(Comment);
    expect(thread.comments[1].tempId).toBeUndefined();
    expect(thread.comments[1].text).toBe("new comment");
  });

  test("deserialize with empty target array creates new items using @ArrayOf constructor", () => {
    const post = new Post();
    post.id = 999;
    post.title = "Test Post";
    post.author = new User();
    post.author.id = 50;
    post.author.name = "Ivy";
    post.comments = [];

    const data = {
      id: 999,
      title: "Test Post",
      author: { id: 50, name: "Ivy" },
      comments: [{ id: 1, text: "great" }],
    };

    deserialize(post, data);
    expect(post.comments).toBeInstanceOf(Array);
    expect(post.comments[0]).toBeInstanceOf(Comment);
    expect(post.comments[0].id).toBe(1);
    expect(post.comments[0].text).toBe("great");
  });

  test("deserialize respects explicit @ArrayOf constructor even when data is empty", () => {
    @Serializable
    class Container {
      @Serialize
      @ArrayOf(User)
      users: User[] = [];
    }

    const container = new Container();
    container.users.push(new User());

    const data = { users: [] };
    deserialize(container, data);
    expect(container.users).toHaveLength(0);
  });
});

describe("Deserialization – Edge Cases", () => {
  test("handles circular references – preserves existing circular graph", () => {
    @Serializable
    class Node {
      @Id
      id!: number;

      @Serialize
      name!: string;

      @Serialize
      parent?: Node;
    }

    const root = new Node();
    root.id = 1;
    root.name = "Root";

    const child = new Node();
    child.id = 2;
    child.name = "Child";
    child.parent = root;

    root.parent = child;

    const data = {
      id: 1,
      name: "Root Updated",
      parent: {
        id: 2,
        name: "Child Updated",
        parent: {
          id: 1,
          name: "Root Updated Again",
        },
      },
    };

    deserialize(root, data);

    expect(root.name).toBe("Root Updated Again");
    expect(root.parent).toBe(child);
    expect(root.parent.name).toBe("Child Updated");
    expect(root.parent?.parent).toBe(root);
    expect(root.parent?.parent?.name).toBe("Root Updated Again");
  });

  test("preserves non‑whitelisted properties on existing target", () => {
    const article = new Article();
    article.id = 10;
    article.content = "old content";
    article.internalState = { hidden: true };

    const data = {
      id: 10,
      content: "new content",
    };

    deserialize(article, data);
    expect(article.content).toBe("new content");
    expect(article.internalState).toEqual({ hidden: true });
  });

  test("does not remove object properties missing from data", () => {
    const user = new User();
    user.id = 1;
    user.name = "John";
    user.age = 30;

    const data = { id: 1 };
    deserialize(user, data);
    expect(user.name).toBe("John");
    expect(user.age).toBe(30);
  });

  test("replaces primitive properties with new values", () => {
    const user = new User();
    user.id = 5;
    user.name = "Old";

    const data = { id: 5, name: "New" };
    deserialize(user, data);
    expect(user.name).toBe("New");
  });

  test("deserialize throws when top‑level data is array and no target", () => {
    expect(() => {
      deserialize(null, [1, 2, 3]);
    }).toThrow(
      "Cannot infer constructor for deserialization without existing target",
    );
  });

  test("deserialize can handle arrays as top‑level if target given", () => {
    const target = [new User(), new User()];
    target[0].id = 1;
    target[0].name = "First";
    target[1].id = 2;
    target[1].name = "Second";

    const data = [
      { id: 1, name: "First Updated" },
      { id: 3, name: "Third" },
    ];
    const result = deserialize(target, data);
    expect(result).toBe(target);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("First Updated");
    expect(result[1].id).toBe(3);
    expect(result[1]).toBeInstanceOf(User);
  });

  test("deserialize with @TempId deletes it even for new objects", () => {
    const comment = new Comment();
    comment.tempId = "abc";
    comment.id = 1;
    comment.text = "old";

    const newData = {
      id: 1,
      tempId: "abc",
      text: "new",
    };
    deserialize(comment, newData);
    expect(comment.text).toBe("new");
    expect(comment.tempId).toBeUndefined();
  });
});

describe("Integration – Full roundtrip", () => {
  test("serialize then deserialize yields equivalent object (except ID)", () => {
    const original = new Post();
    original.id = 100;
    original.title = "Roundtrip";
    original.author = new User();
    original.author.id = 42;
    original.author.name = "Sarah";
    original.comments = [
      { id: 1, text: "good", author: original.author } as Comment,
      { id: 2, text: "excellent" } as Comment,
    ];

    const json = JSON.parse(JSON.stringify(original));

    const copy = new Post();
    copy.id = 100;
    copy.author = new User();
    copy.author.id = 42;
    copy.comments = [];

    deserialize(copy, json);

    expect(copy.id).toBe(100);
    expect(copy.title).toBe(original.title);
    expect(copy.author).toBeInstanceOf(User);
    expect(copy.author.id).toBe(42);
    expect(copy.author.name).toBe("Sarah");
    expect(copy.comments).toHaveLength(2);
    expect(copy.comments[0]).toBeInstanceOf(Comment);
    expect(copy.comments[0].id).toBe(1);
    expect(copy.comments[0].text).toBe("good");
    expect(copy.comments[0].author).not.toBe(copy.author);
  });
});

describe("Lifecycle – initialize and destroy", () => {
  class LifecycleObject {
    @Id
    id!: number;

    @Serialize
    value?: string;

    initialized = false;
    destroyed = false;

    initialize() {
      this.initialized = true;
    }

    destroy() {
      this.destroyed = true;
    }
  }

  class Container {
    @Id
    id!: number;

    @Serialize
    @ArrayOf(LifecycleObject)
    items: LifecycleObject[] = [];

    @Serialize
    nested?: LifecycleObject | null;
  }

  test("initialize is called for new array elements (empty target -> new items)", () => {
    const container = new Container();
    container.id = 1;
    container.items = [];

    const data = {
      id: 1,
      items: [
        { id: 10, value: "first" },
        { id: 11, value: "second" },
      ],
    };

    deserialize(container, data);
    expect(container.items).toHaveLength(2);
    expect(container.items[0]).toBeInstanceOf(LifecycleObject);
    expect(container.items[0].initialized).toBe(true);
    expect(container.items[0].id).toBe(10);
    expect(container.items[0].value).toBe("first");
    expect(container.items[1].initialized).toBe(true);
    expect(container.items[1].id).toBe(11);
    expect(container.items[1].value).toBe("second");
  });

  test("initialize is called for new array elements when array grows (no ID matching)", () => {
    class NoIdItem {
      @Serialize
      value!: string;

      initialized = false;
      destroyed = false;

      initialize() {
        this.initialized = true;
      }
      destroy() {
        this.destroyed = true;
      }
    }

    class Bag {
      @Serialize
      @ArrayOf(NoIdItem)
      items: NoIdItem[] = [];
    }

    const bag = new Bag();
    const old1 = new NoIdItem();
    old1.value = "old1";
    bag.items = [old1];

    const data = { items: [{ value: "new1" }, { value: "new2" }] };
    deserialize(bag, data);

    expect(bag.items).toHaveLength(2);
    expect(bag.items[0].initialized).toBe(false);
    expect(bag.items[0].value).toBe("new1");
    expect(bag.items[1].initialized).toBe(true);
    expect(bag.items[1].value).toBe("new2");
    expect(old1.destroyed).toBe(false);
  });

  test("destroy is called when array elements are truncated (no ID matching)", () => {
    class NoIdItem {
      @Serialize
      value!: string;

      destroyed = false;
      destroy() {
        this.destroyed = true;
      }
    }

    class Bag {
      @Serialize
      @ArrayOf(NoIdItem)
      items: NoIdItem[] = [];
    }

    const bag = new Bag();
    const old1 = new NoIdItem();
    old1.value = "old1";
    const old2 = new NoIdItem();
    old2.value = "old2";
    bag.items = [old1, old2];

    const data = { items: [{ value: "new" }] };
    deserialize(bag, data);
    expect(bag.items).toHaveLength(1);
    expect(old1.destroyed).toBe(false);
    expect(old2.destroyed).toBe(true);
  });

  test("destroy is called when array element is removed (by ID matching)", () => {
    const container = new Container();
    container.id = 1;
    const item1 = new LifecycleObject();
    item1.id = 10;
    item1.value = "old";
    const item2 = new LifecycleObject();
    item2.id = 11;
    item2.value = "will be removed";
    container.items = [item1, item2];

    const data = {
      id: 1,
      items: [{ id: 10, value: "updated" }],
    };

    deserialize(container, data);
    expect(container.items).toHaveLength(1);
    expect(container.items[0]).toBe(item1);
    expect(item2.destroyed).toBe(true);
    expect(item1.destroyed).toBe(false);
  });

  test("destroy is called when nested object property is set to null", () => {
    const container = new Container();
    container.id = 1;
    const oldNested = new LifecycleObject();
    oldNested.id = 20;
    oldNested.value = "old";
    container.nested = oldNested;

    const data = {
      id: 1,
      nested: null,
    };

    deserialize(container, data);
    expect(container.nested).toBeNull();
    expect(oldNested.destroyed).toBe(true);
  });

  test("initialize is NOT called when reusing an existing nested object (property already set)", () => {
    const container = new Container();
    container.id = 1;
    const nested = new LifecycleObject();
    nested.id = 42;
    nested.value = "existing";
    container.nested = nested;
    nested.initialized = false;

    const data = {
      id: 1,
      nested: { id: 42, value: "updated" },
    };

    deserialize(container, data);
    expect(container.nested).toBe(nested);
    expect(nested.initialized).toBe(false);
    expect(nested.value).toBe("updated");
  });
});
