export class Walker {
    private walker: TreeWalker;

    constructor(korenovyElement: Element) {
        this.walker = document.createTreeWalker(
            korenovyElement,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: (node) => {
                    if (node.nodeType === Node.ELEMENT_NODE && /^H[1-6]$/.test((node as Element).tagName)) {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            }
        );
    }

    public nasledovnyNadpis(): HTMLHeadingElement | null {
        const nextNode = this.walker.nextNode();
        if (nextNode && nextNode instanceof HTMLHeadingElement) {
            return nextNode;
        }
        return null;
    }
}