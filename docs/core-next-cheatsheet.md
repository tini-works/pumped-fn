# @pumped-fn/core-next Cheat Sheet

## Core Concepts

- **Executors**: Functions that produce values and can have dependencies
- **Scope**: A container for managing executors and their state
- **Reactive vs Static vs Lazy**: Different modes for handling state updates

## Core Functions

### `provide(factory, ...metas)`
Creates an executor with no dependencies.

```typescript
import { provide, meta, custom } from '@pumped-fn/core-next';

// Create a simple state
const counter = provide(() => 0);

// Create a state with initial complex value
const user = provide(() => ({
  name: 'John',
  email: 'john@example.com'
}));

// With metadata
const name = meta("name", custom<string>());
const counter = provide(() => 0, name("counter"));

// Create a function provider
const idGenerator = provide(() => {
  let id = 0;
  return () => {
    id++;
    return id.toString();
  };
});
```

### `derive(dependencies, factory, ...metas)`
Creates an executor that depends on other executors.

```typescript
import { provide, derive } from '@pumped-fn/core-next';

// Single dependency
const doubledCounter = derive(counter, (count) => count * 2);

// Multiple dependencies as array
const fullName = derive(
  [firstName, lastName],
  ([first, last]) => `${first} ${last}`
);

// Multiple dependencies as object
const userDetails = derive(
  { user: userState, settings: userSettings },
  ({ user, settings }) => ({
    ...user,
    preferences: settings
  })
);

// With controller for cleanup
const timer = derive(
  [config.reactive, counter.static],
  ([config, counterCtl], ctl) => {
    const interval = setInterval(() => {
      counterCtl.update(value => value + config.increment);
    }, config.interval);

    // Cleanup when dependencies change or component unmounts
    ctl.cleanup(() => {
      clearInterval(interval);
    });
  }
);
```

### `preset(executor, value)`
Presets an executor with a specific value.

```typescript
import { preset } from '@pumped-fn/core-next';

const presetCounter = preset(counter, 10);
```

## Executor Variants

Each executor has three variants:

### `.static`
The executor will be resolved once and cached. Returns an accessor that can be used to update the value.

```typescript
// Define controller
const counterController = derive(counter.static, (counterRef) => {
  return {
    increment: () => counterRef.update(count => count + 1),
    decrement: () => counterRef.update(count => count - 1),
    reset: () => counterRef.update(0)
  };
});
```

### `.reactive`
The executor will be re-evaluated when its dependencies change.

```typescript
// Reactive dependency
const completedTodos = derive(
  [todos.reactive],
  ([todos]) => todos.filter(todo => todo.completed)
);
```

### `.lazy`
The executor will be evaluated only when accessed.

```typescript
const lazyCounter = counter.lazy;
```

## Meta Information

Add metadata to executors for debugging or other purposes.

```typescript
import { meta, custom } from '@pumped-fn/core-next';

// Create a meta function
const name = meta("name", custom<string>());

// Apply metadata to an executor
const counter = provide(() => 0, name("counter"));
```

## Scope Management

```typescript
import { createScope } from '@pumped-fn/core-next';

// Create a new scope
const scope = createScope();

// With presets
const scope = createScope(preset(counter, 10));

// Resolve an executor
const value = await scope.resolve(counter);

// Get an accessor
const accessor = scope.accessor(counter);

// Update an executor
await scope.update(counter, (current) => current + 1);
// Or directly
await scope.update(counter, 10);

// Release an executor
await scope.release(counter);

// Dispose the scope
await scope.dispose();
```

## Accessor API

When you get an accessor from a scope, you can:

```typescript
// Get the current value
const value = accessor.get();

// Resolve (possibly async)
const value = await accessor.resolve();

// Update the value
await accessor.update(newValue);
// Or with a function
await accessor.update(current => current + 1);

// Subscribe to changes
const cleanup = accessor.subscribe(value => {
  console.log('Value changed:', value);
});

// Release the accessor
await accessor.release();
```

## Schema Validation

```typescript
import { custom } from '@pumped-fn/core-next';

// Create a custom schema
const stringSchema = custom<string>();
```

## Real-World Examples

### Counter Example

```typescript
import { provide, derive, meta, custom } from '@pumped-fn/core-next';

const name = meta("name", custom<string>());

// Configuration
const config = provide(
  () => ({
    increment: 1,
    interval: 500,
  }),
  name("config")
);

// Config controller
const configController = derive(
  config.static,
  (configCtl) => {
    return {
      changeIncrement: (increment: number) =>
        configCtl.update((config) => ({
          ...config,
          increment: config.increment + increment,
        })),
      changeInterval: (interval: number) =>
        configCtl.update((config) => ({
          ...config,
          interval: config.interval + interval * 100,
        })),
    };
  },
  name("configCtl")
);

// Counter state
const counter = provide(() => 0, name("timer"));

// Timer effect
const timer = derive(
  [config.reactive, counter.static],
  ([config, counterCtl], ctl) => {
    const interval = setInterval(() => {
      counterCtl.update((value) => value + config.increment);
    }, config.interval);

    ctl.cleanup(() => {
      clearInterval(interval);
    });
  },
  name("timer")
);

export const counterApp = {
  config,
  configController,
  counter,
  timer,
};
```

### Todo App Example

```typescript
import { derive, provide } from '@pumped-fn/core-next';

export type Todo = {
  id: string;
  content: string;
  completed: boolean;
};

// ID generator
const idGenerator = provide(() => {
  let id = 0;
  return () => {
    id++;
    return id.toString();
  };
});

// Todos state
const todos = provide(() => [] as Todo[]);

// Derived state - completed todos
const completedTodos = derive([todos.reactive], ([todos]) => {
  return todos.filter((todo) => todo.completed);
});

// Selected todo ID
const selectedTodoId = provide(() => null as string | null);

// Set selected todo ID
const setSelectedTodoId = derive([selectedTodoId.static], ([ref]) => {
  return (id: string | null) => {
    ref.update(id);
  };
});

// Selected todo
const selectedTodo = derive(
  [selectedTodoId.reactive, todos.reactive],
  ([selectedTodoId, todos]) => {
    const todo = selectedTodoId
      ? todos.find((todo) => todo.id === selectedTodoId)
      : null;
    return todo;
  }
);

// Todos controller
const todosController = derive(
  [idGenerator, todos.static],
  ([idGenerator, refTodos]) => {
    return {
      addTodo: (todo: Omit<Todo, "id">) => {
        refTodos.update((todos) => {
          const newTodo = { ...todo, id: idGenerator() };
          return [...todos, newTodo];
        });
      },
      removeTodo: (id: string) => {
        refTodos.update((todos) => {
          return todos.filter((todo) => todo.id !== id);
        });
      },
      toggleComplete: (id: string) => {
        refTodos.update((todos) => {
          return todos.map((todo) => {
            if (todo.id === id) {
              return { ...todo, completed: !todo.completed };
            }
            return todo;
          });
        });
      },
    };
  }
);

export const todoApp = {
  todos,
  todosController,
  selectedTodo,
  setSelectedTodoId,
  completedTodos,
};
```

