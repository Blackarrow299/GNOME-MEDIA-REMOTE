type Event = { callback: (...args) => void, index: number }

export class EventsHandler {

    protected events: Record<string, Event[]>

    constructor() {
        this.events = {}
    }

    addEventListner(name: string, callback: (...args) => void) {
        let index = 0
        if (this.events[name] && this.events[name].length > 0) {
            index = this.events[name][this.events[name].length - 1].index + 1
        } else {
            this.events[name] = []
        }
        this.events[name].push({ callback, index })

        return { name, index }
    }

    removeEventListner(target: { name: string, index: number }): boolean {
        if (target.name in this.events) {
            if (this.events[target.name].length <= 0) {
                return delete this.events[target.name]
            } else {
                this.events[target.name] = this.events[target.name].filter((e) => {
                    return e.index !== target.index
                })
            }
            return true
        } else {
            return false
        }
    }

    on(name: string, callback: (...args) => void) {
        return this.addEventListner(name, callback)
    }

    emit(name: string, ...args) {
        this.events[name].forEach((e) => {
            e.callback(...args)
        })
    }

    removeAllListeners() {
        this.events = {}
    }
}

export default new EventsHandler()
