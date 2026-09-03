import { supabase } from '../lib/supabase'
import type { SearchUserResult, SocialFeedItem, PrivacySettings } from '../types'

export async function searchUsers(query: string, currentUserId: string): Promise<SearchUserResult[]> {
  const { data, error } = await supabase.rpc('search_users', {
    query,
    current_user_id: currentUserId,
  })
  if (error) throw error
  return (data ?? []) as SearchUserResult[]
}

export async function followUser(followingId: string) {
  const { error } = await supabase.from('follows').insert({
    follower_id: (await supabase.auth.getUser()).data.user!.id,
    following_id: followingId,
  })
  if (error) throw error
}

export async function unfollowUser(followingId: string) {
  const userId = (await supabase.auth.getUser()).data.user!.id
  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', userId)
    .eq('following_id', followingId)
  if (error) throw error
}

export async function isFollowing(followingId: string): Promise<boolean> {
  const userId = (await supabase.auth.getUser()).data.user!.id
  const { data } = await supabase
    .from('follows')
    .select('id')
    .eq('follower_id', userId)
    .eq('following_id', followingId)
    .maybeSingle()
  return !!data
}

export async function getFollowers(userId: string): Promise<SearchUserResult[]> {
  const currentUser = (await supabase.auth.getUser()).data.user
  const { data, error } = await supabase
    .from('follows')
    .select('follower_id, profiles!follows_follower_id_fkey(id, username, name, avatar_url, bio, followers_count, following_count)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const results: SearchUserResult[] = []
  for (const row of data ?? []) {
    const p = row.profiles as any
    if (!p?.username) continue
    let isFollowingUser = false
    if (currentUser) {
      const { data: f } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', p.id)
        .maybeSingle()
      isFollowingUser = !!f
    }
    results.push({ ...p, is_following: isFollowingUser })
  }
  return results
}

export async function getFollowing(userId: string): Promise<SearchUserResult[]> {
  const currentUser = (await supabase.auth.getUser()).data.user
  const { data, error } = await supabase
    .from('follows')
    .select('following_id, profiles!follows_following_id_fkey(id, username, name, avatar_url, bio, followers_count, following_count)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  const results: SearchUserResult[] = []
  for (const row of data ?? []) {
    const p = row.profiles as any
    if (!p?.username) continue
    let isFollowingUser = false
    if (currentUser) {
      const { data: f } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', currentUser.id)
        .eq('following_id', p.id)
        .maybeSingle()
      isFollowingUser = !!f
    }
    results.push({ ...p, is_following: isFollowingUser })
  }
  return results
}

export async function getSocialFeed(userId: string): Promise<SocialFeedItem[]> {
  const { data, error } = await supabase.rpc('get_social_feed', {
    current_user_id: userId,
    feed_limit: 30,
  })
  if (error) throw error
  return (data ?? []) as SocialFeedItem[]
}

export async function getProfileByUsername(username: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username_lower', username.toLowerCase())
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getPrivacySettings(userId: string): Promise<PrivacySettings | null> {
  const { data } = await supabase
    .from('privacy_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

export async function updatePrivacySettings(userId: string, settings: Partial<PrivacySettings>) {
  const { error } = await supabase
    .from('privacy_settings')
    .upsert({ user_id: userId, ...settings })
  if (error) throw error
}

export async function updateProfile(userId: string, data: { bio?: string; is_public?: boolean }) {
  const { error } = await supabase.from('profiles').update(data).eq('id', userId)
  if (error) throw error
}
