const HEADING_PATTERN = /^H[1-6]$/;

export class NadpisWalker {
    private readonly walker: TreeWalker;

    constructor(korenovyElement: Element) {
        this.walker = document.createTreeWalker(korenovyElement, NodeFilter.SHOW_ELEMENT, {
            acceptNode: (node) =>
                HEADING_PATTERN.test((node as Element).tagName)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_SKIP,
        });
    }

    public nasledovnyNadpis(): HTMLHeadingElement | null {
        return this.walker.nextNode() as HTMLHeadingElement | null;
    }
}
