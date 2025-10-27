const HEADING_PATTERN = /^H[1-6]$/;

export class NadpisWalker {
    private walker: TreeWalker;

    constructor(korenovyElement: Element) {
        this.walker = document.createTreeWalker(
            korenovyElement,
            NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: (node) =>
                    node.nodeType === Node.ELEMENT_NODE && HEADING_PATTERN.test((node as Element).tagName)
                        ? NodeFilter.FILTER_ACCEPT
                        : NodeFilter.FILTER_SKIP
            }
        );
    }

    public nasledovnyNadpis(): HTMLHeadingElement | null {
        const nextNode = this.walker.nextNode();
        return nextNode instanceof HTMLHeadingElement ? nextNode : null;
    }
}
