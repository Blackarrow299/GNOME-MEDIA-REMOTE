type Event = { callback: (data?: any) => void, index: number }

class EventHandler {

    private events: Record<string, Event[]>

    constructor() {
        this.events = {}
    }

    addEventListner(name: string, callback: () => void) {
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

    on(name: string, callback: () => void) {
        return this.addEventListner(name, callback)
    }

    emit(name: string, data?: any) {
        this.events[name].forEach((e) => {
            e.callback(data)
        })
    }
}

export default new EventHandler()