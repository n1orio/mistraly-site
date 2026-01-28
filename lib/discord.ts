// lib/discord.ts
export async function getDiscordBanner(userId: string) {
  try {
    const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
      headers: {
        Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
      }
    })
    const data = await response.json()
    if (data.banner) {
      return `https://cdn.discordapp.com/banners/${userId}/${data.banner}?size=1024`
    }
  } catch (error) {
    console.error('Error fetching Discord banner:', error)
  }
  return null
}