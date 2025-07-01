# @pumped-fn/core-next Cheat Sheet

## Core Concepts

- **Executors**: Functions that produce values and can have dependencies
- **Scope**: Container for managing executors and their state
- **Variants**: `.static`, `.reactive`, and `.lazy` for different update behaviors

## Basic API

```typescript
import { provide, derive, preset, meta, custom, createScope } from '@pumped-fn/core-next';

// Create executor with no dependencies
const counter = provide(() => 0);

// Create executor with dependencies
const doubled = derive(counter, (count) => count * 2);

// Preset an executor with a value
const presetCounter = preset(counter, 10);

// Add metadata
const name = meta("name", custom<string>());
const labeledCounter = provide(() => 0, name("counter"));

// Create a scope
const scope = createScope();
const value = await scope.resolve(counter);
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

## Common Patterns

### State with Controller

```typescript
// State
const counter = provide(() => 0);

// Controller
const counterController = derive(counter.static, (counterRef) => ({
  increment: () => counterRef.update(count => count + 1),
  decrement: () => counterRef.update(count => count - 1),
  reset: () => counterRef.update(0)
}));
```

### Reactive Dependencies

```typescript
// Reactive dependency that updates when todos changes
const completedTodos = derive(
  [todos.reactive], 
  ([todos]) => todos.filter(todo => todo.completed)
);
```

### Cleanup in Executors

```typescript
const timer = derive(
  [config.reactive, counter.static],
  ([config, counterCtl], ctl) => {
    const interval = setInterval(() => {
      counterCtl.update(value => value + config.increment);
    }, config.interval);

    // Register cleanup function
    ctl.cleanup(() => {
      clearInterval(interval);
    });
  }
);
```

