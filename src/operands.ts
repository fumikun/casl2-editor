type CommentBuilder = (label: string | null, operands: string[]) => string

function parseOperands(opr: string): string[] {
    return opr.split(",").map(v => v.trim()).filter(Boolean)
}

function isRegister(v?: string): boolean {
    return !!v && /^GR\d+$/.test(v)
}

function mem(addr: string, x?: string) {
    return x ? `(${addr} + ${x})` : `(${addr})`
}

function addr(addr: string, x?: string) {
    const formatted = x ? `${addr} + ${x}` : addr
    return /^-?\d+$/.test(addr) ? `(${formatted})` : formatted
}

const rules: Record<string, CommentBuilder> = {

    DC: (label, ops) => `<${label}> <- ${ops[0]}`,

    DS: (label, ops) => `${label} <- ${Number(ops[0]) * 128} 領域`,

    LD: (_, ops) => {
        const [r, a, x] = ops

        if (isRegister(a)) return `${r} <- ${a}`
        return `${r} <- ${mem(a, x)}`
    },

    LAD: (_, ops) => {
        const [r, a, x] = ops
        return `${r} <- ${addr(a, x)}`
    },

    ST: (_, ops) => {
        const [r, a, x] = ops
        return `<${addr(a, x)}> <- ${r}`
    },

    IN: (_, ops) => {
        const [a, x] = ops
        return `INPUT ${addr(a, x)}`
    },

    OUT: (_, ops) => {
        const [a, x] = ops
        return `OUT ${addr(a, x)}`
    },

    ADD: (_, ops) => {
        const [r, a, x] = ops

        if (isRegister(a)) return `${r} <- ${r} + ${a}`

        return `${r} <- ${r} + ${mem(a, x)}`
    },

    SUB: (_, ops) => {
        const [r, a, x] = ops

        if (isRegister(a)) return `${r} <- ${r} - ${a}`

        return `${r} <- ${r} - ${mem(a, x)}`
    },

    AND: (_, ops) => {
        const [r, a, x] = ops

        if (isRegister(a)) return `${r} <- ${r} & ${a}`

        return `${r} <- ${r} & ${mem(a, x)}`
    },

    OR: (_, ops) => {
        const [r, a, x] = ops

        if (isRegister(a)) return `${r} <- ${r} | ${a}`

        return `${r} <- ${r} | ${mem(a, x)}`
    },

    XOR: (_, ops) => {
        const [r, a, x] = ops

        if (isRegister(a)) return `${r} <- ${r} ^ ${a}`

        return `${r} <- ${r} ^ ${mem(a, x)}`
    },

    CP: (_, ops) => {
        const [r, a, x] = ops

        if (isRegister(a)) return `${r}:${a}`

        return `|${r} - ${mem(a, x)}|`
    },

    SL: (_, ops) => {
        const [r, a, x] = ops
        return `${r} <- ${r} << ${addr(a, x)}`
    },

    SR: (_, ops) => {
        const [r, a, x] = ops
        return `${r} <- ${r} >> ${addr(a, x)}`
    },

    JMI: (_, ops) => `SF=1 then goto ${addr(ops[0], ops[1])}`,
    JNZ: (_, ops) => `ZF=0 then goto ${addr(ops[0], ops[1])}`,
    JZE: (_, ops) => `ZF=1 then goto ${addr(ops[0], ops[1])}`,
    JPL: (_, ops) => `SF=0 & ZF=0 then goto ${addr(ops[0], ops[1])}`,
    JOV: (_, ops) => `OF=1 then goto ${addr(ops[0], ops[1])}`,

    JUMP: (_, ops) => `goto ${addr(ops[0], ops[1])}`,

    PUSH: (_, ops) => {
        const [a, x] = ops
        return `SP <- SP - 1, <SP> <- ${addr(a, x)}`
    },

    POP: (_, ops) => `(SP)->${ops[0]}, <SP> <- SP + 1`,

    SVC: (_, ops) => `SVC ${addr(ops[0], ops[1])}`,

    RET: () => '',

    NOP: () => 'No operation'
}

const alias: Record<string, string> = {
    ADDA: "ADD",
    ADDL: "ADD",
    SUBA: "SUB",
    SUBL: "SUB",
    CPA: "CP",
    CPL: "CP",
    SLA: "SL",
    SLL: "SL",
    SRA: "SR",
    SRL: "SR",
    CALL: "JUMP"
}

function resolveOpcode(opcode: string): string | null {
    const op = opcode.toUpperCase()

    if (rules[op]) return op

    return alias[op] ?? null
}

export function isSupportedOpcode(opcode: string): boolean {
    return resolveOpcode(opcode) !== null
}

export function buildComment(
    label: string | null,
    opcode: string,
    operand: string
): string | null {
    const key = resolveOpcode(opcode)

    if (!key) return null

    const ops = parseOperands(operand)

    return rules[key](label, ops)
}