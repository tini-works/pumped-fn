# @pumped-fn/extra Cheat Sheet

The `@pumped-fn/extra` package provides additional utilities for building full-stack applications with pumped-fn.

## Exports

The package has multiple entry points:
- `@pumped-fn/extra` - Main exports
- `@pumped-fn/extra/client` - Client-side utilities
- `@pumped-fn/extra/server` - Server-side utilities
- `@pumped-fn/extra/implicit` - Implicit utilities

## Client Utilities

### HTTP Client

```typescript
import { createClient } from '@pumped-fn/extra/client';

// Create a client for API calls
const client = createClient({
  baseUrl: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Use the client in an executor
const fetchUsers = provide(async (controller) => {
  try {
    const response = await client.get('/users');
    return response.data;
  } catch (error) {
    controller.error(error);
    return [];
  }
});

// POST request
const createUser = provide(async (controller) => {
  return async (userData) => {
    try {
      const response = await client.post('/users', userData);
      return response.data;
    } catch (error) {
      controller.error(error);
      return null;
    }
  };
});

// With query parameters
const searchUsers = provide(async (controller) => {
  return async (query) => {
    try {
      const response = await client.get('/users', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      controller.error(error);
      return [];
    }
  };
});
```

## Logging

```typescript
import { createLogger } from '@pumped-fn/extra';

// Create a logger
const logger = createLogger({
  level: 'info', // 'debug', 'info', 'warn', 'error'
  prefix: 'MyApp'
});

// Use the logger
logger.debug('Detailed debugging information');
logger.info('Application started');
logger.warn('Something might be wrong', { details: { ... } });
logger.error('Something went wrong', { error });

// Create a logger with custom transport
const customLogger = createLogger({
  level: 'info',
  prefix: 'MyApp',
  transport: (level, message, meta) => {
    // Custom logging logic
    console.log(`[${level.toUpperCase()}] ${prefix}: ${message}`, meta);
    
    // Send to monitoring service
    if (level === 'error') {
      sendToMonitoringService(message, meta);
    }
  }
});
```

## Server Utilities

```typescript
import { createRouter } from '@pumped-fn/extra/server';

// Create a router
const router = createRouter();

// Define routes
router.get('/users', async (req, res) => {
  const users = await db.getUsers();
  return users;
});

router.post('/users', async (req, res) => {
  const newUser = await db.createUser(req.body);
  return newUser;
});

// Use with Express
import express from 'express';
const app = express();

app.use('/api', router.handler());
app.listen(3000);
```

## Implicit Utilities

```typescript
import { createImplicitScope } from '@pumped-fn/extra/implicit';

// Create an implicit scope
const implicitScope = createImplicitScope();

// Use the implicit scope
const counter = provide(() => 0);
implicitScope.resolve(counter);

// Update the counter
implicitScope.update(counter, 1);

// Get the current value
const value = implicitScope.get(counter);
```

## Integration with Core Package

### API Data Fetching

```typescript
import { provide, derive } from '@pumped-fn/core-next';
import { createClient } from '@pumped-fn/extra/client';

const client = createClient({
  baseUrl: '/api'
});

// User data
const userQuery = provide(async (controller) => {
  controller.loading();
  try {
    const response = await client.get('/user');
    return response.data;
  } catch (error) {
    controller.error(error);
    return null;
  }
});

// User posts
const userPostsQuery = derive(userQuery, async (user, controller) => {
  if (!user) return [];
  
  controller.loading();
  try {
    const response = await client.get(`/users/${user.id}/posts`);
    return response.data;
  } catch (error) {
    controller.error(error);
    return [];
  }
});
```

### Logging Integration

```typescript
import { provide, derive } from '@pumped-fn/core-next';
import { createLogger } from '@pumped-fn/extra';

const logger = createLogger({
  level: 'info',
  prefix: 'MyApp'
});

// Log state changes
const counter = provide(() => 0);

const counterLogger = derive(counter.reactive, (count) => {
  logger.info('Counter changed', { count });
  return count;
});

// Log errors
const errorHandler = derive(
  [userQuery.reactive, postsQuery.reactive],
  ([userState, postsState]) => {
    if (userState.error) {
      logger.error('User query failed', { error: userState.error });
    }
    
    if (postsState.error) {
      logger.error('Posts query failed', { error: postsState.error });
    }
  }
);
```

## Common Patterns

### API Service Layer

```typescript
import { provide, derive } from '@pumped-fn/core-next';
import { createClient } from '@pumped-fn/extra/client';

// Create API client
const client = createClient({
  baseUrl: '/api'
});

// API service
const apiService = provide(() => {
  return {
    getUsers: async () => {
      const response = await client.get('/users');
      return response.data;
    },
    
    getUser: async (id) => {
      const response = await client.get(`/users/${id}`);
      return response.data;
    },
    
    createUser: async (userData) => {
      const response = await client.post('/users', userData);
      return response.data;
    },
    
    updateUser: async (id, userData) => {
      const response = await client.put(`/users/${id}`, userData);
      return response.data;
    },
    
    deleteUser: async (id) => {
      await client.delete(`/users/${id}`);
      return true;
    }
  };
});

// Use the service in other executors
const usersQuery = derive(apiService, async (api, controller) => {
  controller.loading();
  try {
    return await api.getUsers();
  } catch (error) {
    controller.error(error);
    return [];
  }
});
```

### Authentication Flow

```typescript
import { provide, derive } from '@pumped-fn/core-next';
import { createClient } from '@pumped-fn/extra/client';

// Create API client
const client = createClient({
  baseUrl: '/api'
});

// Auth state
const authState = provide(() => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
}));

// Auth controller
const authController = derive(authState.static, (authRef) => {
  return {
    login: async (credentials) => {
      authRef.update(state => ({ ...state, loading: true, error: null }));
      
      try {
        const response = await client.post('/login', credentials);
        const { user, token } = response.data;
        
        localStorage.setItem('token', token);
        client.setHeader('Authorization', `Bearer ${token}`);
        
        authRef.update(state => ({
          ...state,
          user,
          token,
          loading: false
        }));
        
        return true;
      } catch (error) {
        authRef.update(state => ({
          ...state,
          loading: false,
          error: error.message
        }));
        
        return false;
      }
    },
    
    logout: () => {
      localStorage.removeItem('token');
      client.removeHeader('Authorization');
      
      authRef.update({
        user: null,
        token: null,
        loading: false,
        error: null
      });
    },
    
    checkAuth: async () => {
      const token = authRef.get().token;
      
      if (!token) return false;
      
      authRef.update(state => ({ ...state, loading: true }));
      
      try {
        client.setHeader('Authorization', `Bearer ${token}`);
        const response = await client.get('/me');
        
        authRef.update(state => ({
          ...state,
          user: response.data,
          loading: false
        }));
        
        return true;
      } catch (error) {
        localStorage.removeItem('token');
        client.removeHeader('Authorization');
        
        authRef.update({
          user: null,
          token: null,
          loading: false,
          error: error.message
        });
        
        return false;
      }
    }
  };
});

// Initialize auth on app start
const authInitializer = derive(authController, async (auth) => {
  await auth.checkAuth();
});
```

