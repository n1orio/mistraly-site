import { h, type FunctionalComponent } from 'vue'
import alert from 'pixelarticons/svg/warning-diamond.svg?raw'
import anchor from 'pixelarticons/svg/anchor.svg?raw'
import arrowRight from 'pixelarticons/svg/arrow-right.svg?raw'
import bookOpen from 'pixelarticons/svg/book-open.svg?raw'
import check from 'pixelarticons/svg/check.svg?raw'
import chevronLeft from 'pixelarticons/svg/chevron-left.svg?raw'
import clock from 'pixelarticons/svg/clock.svg?raw'
import close from 'pixelarticons/svg/close.svg?raw'
import coffee from 'pixelarticons/svg/coffee.svg?raw'
import compass from 'pixelarticons/svg/compass.svg?raw'
import copy from 'pixelarticons/svg/copy.svg?raw'
import cpu from 'pixelarticons/svg/cpu.svg?raw'
import creditCard from 'pixelarticons/svg/credit-card.svg?raw'
import discord from 'pixelarticons/svg/discord.svg?raw'
import download from 'pixelarticons/svg/download.svg?raw'
import externalLink from 'pixelarticons/svg/external-link.svg?raw'
import gamepad from 'pixelarticons/svg/gamepad.svg?raw'
import gear from 'pixelarticons/svg/gear.svg?raw'
import globe from 'pixelarticons/svg/globe.svg?raw'
import history from 'pixelarticons/svg/clock.svg?raw'
import home from 'pixelarticons/svg/home.svg?raw'
import key from 'pixelarticons/svg/key.svg?raw'
import link from 'pixelarticons/svg/link.svg?raw'
import loader from 'pixelarticons/svg/loader.svg?raw'
import logout from 'pixelarticons/svg/logout.svg?raw'
import message from 'pixelarticons/svg/message.svg?raw'
import monitor from 'pixelarticons/svg/monitor.svg?raw'
import packageIcon from 'pixelarticons/svg/package.svg?raw'
import plus from 'pixelarticons/svg/plus.svg?raw'
import power from 'pixelarticons/svg/power.svg?raw'
import radio from 'pixelarticons/svg/radio.svg?raw'
import reload from 'pixelarticons/svg/reload.svg?raw'
import save from 'pixelarticons/svg/save.svg?raw'
import lock from 'pixelarticons/svg/lock.svg?raw'
import script from 'pixelarticons/svg/script.svg?raw'
import search from 'pixelarticons/svg/search.svg?raw'
import shield from 'pixelarticons/svg/shield.svg?raw'
import shoppingBag from 'pixelarticons/svg/shopping-bag.svg?raw'
import sparkles from 'pixelarticons/svg/sparkles.svg?raw'
import sword from 'pixelarticons/svg/sword.svg?raw'
import terminal from 'pixelarticons/svg/terminal.svg?raw'
import upload from 'pixelarticons/svg/upload.svg?raw'
import users from 'pixelarticons/svg/users.svg?raw'
import wallet from 'pixelarticons/svg/wallet.svg?raw'
import zap from 'pixelarticons/svg/zap.svg?raw'

/**
 * Пиксельные иконки (pixelarticons, MIT). Рисунок у них на сетке 12×12,
 * поэтому размер приводим к кратному 12: иначе «пиксели» станут разной
 * толщины. Компоненты принимают size, как lucide, который стоял тут раньше.
 */
type IconProps = { size?: number }

function snap(size: number) {
  return Math.max(12, Math.round(size / 12) * 12)
}

function icon(raw: string): FunctionalComponent<IconProps> {
  const inner = raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')
  const component: FunctionalComponent<IconProps> = (props) => {
    const size = snap(props.size ?? 24)
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 24 24',
      width: size,
      height: size,
      fill: 'currentColor',
      'shape-rendering': 'crispEdges',
      'aria-hidden': 'true',
      innerHTML: inner,
    })
  }
  component.props = ['size']
  return component
}

export const AlertTriangle = icon(alert)
export const Anchor = icon(anchor)
export const ArrowRight = icon(arrowRight)
export const BookOpen = icon(bookOpen)
export const Check = icon(check)
export const ChevronLeft = icon(chevronLeft)
export const Clock = icon(clock)
export const Coffee = icon(coffee)
export const Cog = icon(gear)
export const Compass = icon(compass)
export const Copy = icon(copy)
export const Cpu = icon(cpu)
export const CreditCard = icon(creditCard)
export const Discord = icon(discord)
export const Download = icon(download)
export const ExternalLink = icon(externalLink)
export const Gamepad = icon(gamepad)
export const Gavel = icon(lock)
export const Globe = icon(globe)
export const Hammer = icon(gear)
export const HelpCircle = icon(message)
export const History = icon(history)
export const Home = icon(home)
export const Key = icon(key)
export const Link = icon(link)
export const Loader2 = icon(loader)
export const LogOut = icon(logout)
export const MessageCircle = icon(discord)
export const MessageSquare = icon(message)
export const Monitor = icon(monitor)
export const Package = icon(packageIcon)
export const Plus = icon(plus)
export const Power = icon(power)
export const Radio = icon(radio)
export const RefreshCw = icon(reload)
export const Rocket = icon(zap)
export const Save = icon(save)
export const Scale = icon(shield)
export const ScrollText = icon(script)
export const Search = icon(search)
export const Shield = icon(shield)
export const ShieldAlert = icon(alert)
export const ShieldCheck = icon(shield)
export const ShoppingBag = icon(shoppingBag)
export const Sparkles = icon(sparkles)
export const Swords = icon(sword)
export const Terminal = icon(terminal)
export const Ticket = icon(creditCard)
export const Upload = icon(upload)
export const Users = icon(users)
export const Wallet = icon(wallet)
export const X = icon(close)
