import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthTokens, User } from '@/types'

interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  isAuthenticated: boolean
  isLoading: boolean
}

const ACCESS_TOKEN_KEY = 'lms_access_token'
const REFRESH_TOKEN_KEY = 'lms_refresh_token'
const USER_KEY = 'lms_user'

function loadStoredAuth(): Pick<AuthState, 'user' | 'tokens' | 'isAuthenticated'> {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  const userRaw = localStorage.getItem(USER_KEY)

  if (!accessToken || !refreshToken || !userRaw) {
    return { user: null, tokens: null, isAuthenticated: false }
  }

  try {
    const user = JSON.parse(userRaw) as User
    return {
      user,
      tokens: { access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer' },
      isAuthenticated: true,
    }
  } catch {
    return { user: null, tokens: null, isAuthenticated: false }
  }
}

const stored = loadStoredAuth()

const initialState: AuthState = {
  user: stored.user,
  tokens: stored.tokens,
  isAuthenticated: stored.isAuthenticated,
  isLoading: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setCredentials: (state, action: PayloadAction<{ user: User; tokens: AuthTokens }>) => {
      state.user = action.payload.user
      state.tokens = action.payload.tokens
      state.isAuthenticated = true
      localStorage.setItem(ACCESS_TOKEN_KEY, action.payload.tokens.access_token)
      localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.tokens.refresh_token)
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload.user))
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      localStorage.setItem(USER_KEY, JSON.stringify(action.payload))
    },
    updateTokens: (state, action: PayloadAction<AuthTokens>) => {
      state.tokens = action.payload
      localStorage.setItem(ACCESS_TOKEN_KEY, action.payload.access_token)
      localStorage.setItem(REFRESH_TOKEN_KEY, action.payload.refresh_token)
    },
    logout: (state) => {
      state.user = null
      state.tokens = null
      state.isAuthenticated = false
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    },
  },
})

export const { setLoading, setCredentials, updateUser, updateTokens, logout } = authSlice.actions
export default authSlice.reducer
