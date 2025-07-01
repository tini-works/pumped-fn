# @pumped-fn/react Cheat Sheet

## Components

### `ScopeProvider`
Provides a scope to all child components.

```tsx
<ScopeProvider>
  <YourApp />
</ScopeProvider>

// With presets
<ScopeProvider presets={[preset(counter, 10)]}>
  <YourApp />
</ScopeProvider>

// With custom scope
<ScopeProvider scope={customScope}>
  <YourApp />
</ScopeProvider>
```

### `Reactives`
Renders children with reactive values from executors.

```tsx
<Reactives e={[counter, user]}>
  {([count, userData]) => (
    <div>
      <p>Count: {count}</p>
      <p>User: {userData.name}</p>
    </div>
  )}
</Reactives>
```

### `Resolves`
Similar to Reactives but doesn't automatically subscribe to changes.

```tsx
<Resolves e={[counter, user]}>
  {([count, userData]) => (
    <div>
      <p>Count: {count}</p>
      <p>User: {userData.name}</p>
    </div>
  )}
</Resolves>
```

### `Reselect`
Selects a portion of state with memoization.

```tsx
<Reselect 
  e={user} 
  selector={(user) => user.name}
  options={{ equality: (a, b) => a === b }}
>
  {(name) => <div>Name: {name}</div>}
</Reselect>
```

### `Effect`
Resolves executors for side effects.

```tsx
<Effect e={[logger, analytics]} />
```

## Hooks

### `useScope()`
Access the current scope.

```tsx
const scope = useScope();
```

### `useResolves(...executors)`
Resolve multiple executors and subscribe to their changes.

```tsx
const [count, user] = useResolves(counter, userState);
```

### `useResolve(executor, selector, options)`
Resolve an executor with a selector function.

```tsx
const userName = useResolve(
  user, 
  (user) => user.name,
  { 
    equality: (a, b) => a === b,
    snapshot: (value) => value 
  }
);
```

### `useUpdate(executor)`
Get a function to update an executor.

```tsx
const updateCounter = useUpdate(counter);

// Usage
updateCounter(count + 1);
// Or with a function
updateCounter((current) => current + 1);
```

### `useRelease(executor)`
Get a function to release an executor.

```tsx
const releaseCounter = useRelease(counter);

// Usage
releaseCounter();
```

## Common Patterns

### Basic Component with State

```tsx
function Counter() {
  const [count, controller] = useResolves(counter, counterController);
  
  return (
    <div>
      <button onClick={controller.decrement}>-</button>
      <span>{count}</span>
      <button onClick={controller.increment}>+</button>
      <button onClick={controller.reset}>Reset</button>
    </div>
  );
}
```

### Form Component

```tsx
function LoginForm() {
  const [formState, formController] = useResolves(
    loginFormState, 
    loginFormController
  );
  
  const handleSubmit = (e) => {
    e.preventDefault();
    formController.submit();
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formState.username}
        onChange={(e) => formController.updateField('username', e.target.value)}
      />
      {formState.errors.username && (
        <div className="error">{formState.errors.username}</div>
      )}
      
      <input
        type="password"
        value={formState.password}
        onChange={(e) => formController.updateField('password', e.target.value)}
      />
      {formState.errors.password && (
        <div className="error">{formState.errors.password}</div>
      )}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### Data Fetching with Loading State

```tsx
function UserProfile() {
  const [userState] = useResolves(userQuery);
  
  if (userState.loading) {
    return <div>Loading...</div>;
  }
  
  if (userState.error) {
    return <div>Error: {userState.error.message}</div>;
  }
  
  return (
    <div>
      <h1>{userState.data.name}</h1>
      <p>Email: {userState.data.email}</p>
    </div>
  );
}
```

### Complex State Updates

```tsx
function UserSettings() {
  const [user] = useResolves(userState);
  const updateUser = useUpdate(userState);
  
  const toggleDarkMode = () => {
    updateUser((current) => ({
      ...current,
      settings: {
        ...current.settings,
        darkMode: !current.settings.darkMode
      }
    }));
  };
  
  return (
    <div>
      <h2>Settings</h2>
      <label>
        <input
          type="checkbox"
          checked={user.settings.darkMode}
          onChange={toggleDarkMode}
        />
        Dark Mode
      </label>
    </div>
  );
}
```

## Example: Todo App Component

```tsx
function TodoList() {
  const [todos, selectedTodo, controller] = useResolves(
    todoApp.todos,
    todoApp.selectedTodo,
    todoApp.todosController
  );

  return (
    <>
      <h1>Todo list</h1>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <span 
              style={{ 
                textDecoration: todo.completed ? 'line-through' : 'none' 
              }}
            >
              {todo.content}
            </span>
            <button onClick={() => controller.toggleComplete(todo.id)}>
              {todo.completed ? 'Mark Incomplete' : 'Mark Complete'}
            </button>
            <button onClick={() => controller.removeTodo(todo.id)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      {selectedTodo && (
        <div className="selected-todo">
          <h2>{selectedTodo.content}</h2>
          <p>Status: {selectedTodo.completed ? 'Completed' : 'Pending'}</p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const content = e.target.content.value;
          controller.addTodo({ 
            id: Date.now().toString(),
            content, 
            completed: false 
          });
          e.target.reset();
        }}
      >
        <input type="text" name="content" placeholder="New todo" />
        <button type="submit">Add Todo</button>
      </form>
    </>
  );
}
```

