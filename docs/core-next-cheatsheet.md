# @pumped-fn/core-next Cheat Sheet

## Key Concepts

- **Executors**: Functions that produce values and can have dependencies
- **Scope**: A container for managing executors and their state
- **Reactive vs Static**: Different modes for handling state updates

## Core Functions

### `provide(factory, ...metas)`
Creates an executor with no dependencies.

```typescript
// Create a simple state
const counter = provide(() => 0);

// Create a state with initial complex value
const user = provide(() => ({
  name: 'John',
  email: 'john@example.com'
}));

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
```

### `preset(executor, value)`
Presets an executor with a specific value.

```typescript
const presetCounter = preset(counter, 10);
```

## Executor Variants

Each executor has three variants:

### `.static`
The executor will be resolved once and cached.

```typescript
const staticCounter = counter.static;
```

### `.reactive`
The executor will be re-evaluated when its dependencies change.

```typescript
const reactiveCounter = counter.reactive;
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

const name = meta("name", custom<string>());
const counter = provide(() => 0, name("counter"));
```

## Scope Management

```typescript
import { createScope } from '@pumped-fn/core-next';

// Create a new scope
const scope = createScope();

// Resolve an executor
const value = scope.resolve(counter);

// Update an executor
scope.update(counter, (current) => current + 1);
// Or directly
scope.update(counter, 10);

// Release an executor
scope.release(counter);

// Access an executor
const accessor = scope.accessor(counter);
const value = accessor.get();
```

## Common Patterns

### State Management

```typescript
// Define state
const counter = provide(() => 0);

// Define controller
const counterController = derive(counter.static, (counterRef) => {
  return {
    increment: () => counterRef.update(count => count + 1),
    decrement: () => counterRef.update(count => count - 1),
    reset: () => counterRef.update(0)
  };
});
```

### Async Data Fetching

```typescript
const userQuery = provide(async (controller) => {
  controller.loading();
  try {
    const response = await fetch('/api/user');
    const data = await response.json();
    return data;
  } catch (error) {
    controller.error(error);
    return null;
  }
});
```

### Complex Object Updates

```typescript
// In a controller
const updateUser = (userRef) => (updates) => {
  userRef.update((current) => ({
    ...current,
    ...updates,
    settings: {
      ...current.settings,
      ...updates.settings
    }
  }));
};

// Update array item
const toggleItemComplete = (itemsRef) => (id) => {
  itemsRef.update((items) => 
    items.map(item => 
      item.id === id 
        ? { ...item, completed: !item.completed } 
        : item
    )
  );
};
```

## Example: Todo App State

```typescript
// State definitions
const todos = provide(() => [] as Todo[]);
const selectedTodoId = provide(() => null as string | null);

// Derived state
const selectedTodo = derive(
  [selectedTodoId.reactive, todos.reactive],
  ([id, todos]) => todos.find(todo => todo.id === id) || null
);

const completedTodos = derive(
  [todos.reactive],
  ([todos]) => todos.filter(todo => todo.completed)
);

// Controllers
const todosController = derive(
  [todos.static],
  ([todosRef]) => ({
    addTodo: (todo) => {
      todosRef.update(current => [...current, todo]);
    },
    removeTodo: (id) => {
      todosRef.update(current => current.filter(todo => todo.id !== id));
    },
    toggleComplete: (id) => {
      todosRef.update(current => current.map(todo => 
        todo.id === id 
          ? { ...todo, completed: !todo.completed } 
          : todo
      ));
    }
  })
);
```

## Example: Counter with Interval

```typescript
// Configuration
const config = provide(() => ({
  increment: 1,
  interval: 500
}));

// Counter state
const counter = provide(() => 0);

// Timer effect
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

// Config controller
const configController = derive(
  config.static,
  (configCtl) => ({
    changeIncrement: (value) => 
      configCtl.update(config => ({
        ...config,
        increment: value
      })),
    changeInterval: (value) => 
      configCtl.update(config => ({
        ...config,
        interval: value
      }))
  })
);
```

