import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qqkgvhxdxsmishsvxvqf.supabase.co'
const supabaseKey = 'sb_publishable_wWofi_QqtB2Y0-4ZlAA8_g_RZI0F6XE'

export const supabase = createClient(supabaseUrl, supabaseKey)