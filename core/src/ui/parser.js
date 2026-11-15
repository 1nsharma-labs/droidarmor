export class UiParser {
  static parseBounds(boundsStr) {
    if (!boundsStr) return null;
    const match = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (!match) return null;
    const x1 = parseInt(match[1], 10);
    const y1 = parseInt(match[2], 10);
    const x2 = parseInt(match[3], 10);
    const y2 = parseInt(match[4], 10);
    return {
      x1, y1, x2, y2,
      width: x2 - x1,
      height: y2 - y1,
      center: {
        x: Math.round((x1 + x2) / 2),
        y: Math.round((y1 + y2) / 2)
      }
    };
  }

  static parseXml(xmlString) {
    const nodes = [];
    if (!xmlString) return nodes;

    const regex = /<node\s+([^>]+?)\s*(\/?>)/g;
    let match;

    while ((match = regex.exec(xmlString)) !== null) {
      const attrsStr = match[1];
      const attrRegex = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
      let attrMatch;
      const attrs = {};

      while ((attrMatch = attrRegex.exec(attrsStr)) !== null) {
        attrs[attrMatch[1]] = attrMatch[2];
      }

      const bounds = this.parseBounds(attrs['bounds']);
      const text = (attrs['text'] || '').replace(/&amp;/g, '&');
      const contentDesc = (attrs['content-desc'] || '').replace(/&amp;/g, '&');
      const resourceId = attrs['resource-id'] || '';
      const className = attrs['class'] || '';
      const pkg = attrs['package'] || '';
      const clickable = attrs['clickable'] === 'true';
      const checkable = attrs['checkable'] === 'true';
      const checked = attrs['checked'] === 'true';
      const enabled = attrs['enabled'] !== 'false';

      nodes.push({
        text,
        contentDesc,
        resourceId,
        className,
        package: pkg,
        clickable,
        checkable,
        checked,
        enabled,
        bounds,
        center: bounds?.center || null
      });
    }

    return nodes;
  }

  static findElement(nodes, query) {
    if (!query || nodes.length === 0) return null;

    // 1. Exact text match
    if (typeof query === 'string') {
      const exact = nodes.find(n => n.text && n.text.toLowerCase() === query.toLowerCase());
      if (exact) return exact;

      // 2. Partial text match
      const partial = nodes.find(n => n.text && n.text.toLowerCase().includes(query.toLowerCase()));
      if (partial) return partial;

      // 3. Content desc match
      const desc = nodes.find(n => n.contentDesc && n.contentDesc.toLowerCase().includes(query.toLowerCase()));
      if (desc) return desc;

      // 4. Resource ID match
      const res = nodes.find(n => n.resourceId && n.resourceId.toLowerCase().includes(query.toLowerCase()));
      if (res) return res;

      return null;
    }

    // Object selector: { text, resourceId, contentDesc, clickable }
    return nodes.find(node => {
      if (query.text && (!node.text || !node.text.toLowerCase().includes(query.text.toLowerCase()))) {
        return false;
      }
      if (query.resourceId && (!node.resourceId || !node.resourceId.includes(query.resourceId))) {
        return false;
      }
      if (query.contentDesc && (!node.contentDesc || !node.contentDesc.toLowerCase().includes(query.contentDesc.toLowerCase()))) {
        return false;
      }
      if (query.clickable !== undefined && node.clickable !== query.clickable) {
        return false;
      }
      return true;
    }) || null;
  }

  static getInteractiveElements(nodes) {
    return nodes.filter(n => (n.clickable || n.text || n.contentDesc) && n.bounds && n.bounds.width > 0 && n.bounds.height > 0);
  }

  static generateScreenSummary(nodes) {
    const interactives = this.getInteractiveElements(nodes);
    const lines = [];

    lines.push(`📱 Screen State: ${interactives.length} interactive elements detected`);
    lines.push('--------------------------------------------------');

    interactives.forEach((el, index) => {
      const label = el.text || el.contentDesc || el.resourceId.split('/').pop() || el.className.split('.').pop();
      const coords = el.center ? `(${el.center.x}, ${el.center.y})` : 'unknown';
      const type = el.className ? el.className.split('.').pop() : 'Element';
      const clickableBadge = el.clickable ? '[Clickable]' : '';
      lines.push(`[${index + 1}] ${type} "${label}" at ${coords} ${clickableBadge}`);
    });

    return lines.join('\n');
  }
}
