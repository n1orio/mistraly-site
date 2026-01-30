// lib/discord.ts
export async function getDiscordBanner(userId: string): Promise<{
  banner: string | null
  accentColor: number | null
}> {
  try {
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch Discord user:', response.status, response.statusText)
      return { banner: null, accentColor: null }
    }

    const data = await response.json()
    
    let bannerUrl: string | null = null
    
    if (data.banner) {
      const isAnimated = data.banner.startsWith('a_')
      const format = isAnimated ? 'gif' : 'png'
      bannerUrl = `https://cdn.discordapp.com/banners/${userId}/${data.banner}.${format}?size=1024`
    }
    
    return {
      banner: bannerUrl,
      accentColor: data.accent_color || null
    }
  } catch (error) {
    console.error('Error fetching Discord banner:', error)
    return { banner: null, accentColor: null }
  }
}