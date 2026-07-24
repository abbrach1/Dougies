"use client"

import { createContext, useState, useEffect, type ReactNode } from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  type User,
} from "firebase/auth"
import { auth, googleProvider } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  logout: async () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error: any) {
      console.error("Error signing in with Google", error)

      if (error.code === "auth/unauthorized-domain") {
        alert(
          "This domain is not authorized for Google Sign-In. Please add this domain to your Firebase project settings under Authentication > Settings > Authorized domains.",
        )
      } else if (error.code === "auth/popup-closed-by-user") {
        // User closed the popup, no need to show error
        return
      } else {
        alert("Failed to sign in with Google. Please try again.")
      }
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error: any) {
      console.error("Error signing in with email", error)

      if (error.code === "auth/user-not-found") {
        alert("No account found with this email address.")
      } else if (error.code === "auth/wrong-password") {
        alert("Incorrect password.")
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email address.")
      } else {
        alert("Failed to sign in. Please try again.")
      }
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)

      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: name,
      })

      // Refresh the user object to get the updated display name
      await userCredential.user.reload()
    } catch (error: any) {
      console.error("Error creating account", error)

      if (error.code === "auth/email-already-in-use") {
        alert("An account with this email already exists.")
      } else if (error.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.")
      } else if (error.code === "auth/invalid-email") {
        alert("Invalid email address.")
      } else {
        alert("Failed to create account. Please try again.")
      }
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
