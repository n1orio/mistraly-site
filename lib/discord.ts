// lib/discord.ts
export async function getDiscordBanner(userId: string): Promise<string | null> {
  try {
    // 🔴 УБРАЛИ ПРОБЕЛЫ В URL!
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch Discord user:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    
    if (data.banner) {
      const isAnimated = data.banner.startsWith('a_')
      const format = isAnimated ? 'gif' : 'png'
      
      // 🔴 УБРАЛИ ПРОБЕЛЫ В URL!
      return `https://cdn.discordapp.com/banners/${userId}/${data.banner}.${format}?size=1024`
    }
    
    return null
  } catch (error) {
    console.error('Error fetching Discord banner:', error)
    return null
  }
}