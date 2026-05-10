import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kvebuwivvbfzxrnyirbp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWJ1d2l2dmJmenhybnlpcmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDgwNjksImV4cCI6MjA5Mzk4NDA2OX0.dNOZijNhRPn2onNhlxNHLry4VqjZ-fUrZnayn_0fGgs'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createAdmin() {
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@ieee.org',
    password: 'AdminPassword123!',
  })
  
  if (error) {
    console.error('Error creating user:', error.message)
    process.exit(1)
  }
  
  // Also insert into profiles since we have a profiles table
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        { id: data.user.id, email: 'admin@ieee.org', role: 'owner' }
      ])
      
    if (profileError) {
      console.error('Error creating profile:', profileError.message)
    } else {
      console.log('Successfully created admin user: admin@ieee.org')
    }
  }
}

createAdmin()
