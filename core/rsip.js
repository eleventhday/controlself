
export class RSIPEngine {
    constructor() {
        this.nodes = [];
        this.rootId = 'root';
        this.load();
    }

    load() {
        const stored = localStorage.getItem('rsip_nodes');
        if (stored) {
            this.nodes = JSON.parse(stored);
        } else {
            this.initDefault();
        }
    }

    initDefault() {
        this.nodes = [{
            id: 'root',
            title: '核心协议',
            description: '每天打开此应用并回顾这些国策。',
            status: 'active',
            parentId: null,
            children: []
        }];
        this.save();
    }

    save() {
        localStorage.setItem('rsip_nodes', JSON.stringify(this.nodes));
    }

    getNodes() {
        return this.nodes;
    }

    moveNode(nodeId, newParentId) {
        if (nodeId === 'root' || nodeId === newParentId) return;
        
        const node = this.nodes.find(n => n.id === nodeId);
        const newParent = this.nodes.find(n => n.id === newParentId);
        
        if (!node || !newParent) return;

        // Prevent circular dependency (cannot move parent into its own child)
        if (this.isDescendant(nodeId, newParentId)) {
             alert('无法将父节点移动到其子节点下');
             return;
        }

        // Remove from old parent
        if (node.parentId) {
            const oldParent = this.nodes.find(n => n.id === node.parentId);
            if (oldParent) {
                oldParent.children = oldParent.children.filter(id => id !== nodeId);
            }
        }

        // Add to new parent
        node.parentId = newParentId;
        newParent.children.push(nodeId);

        this.save();
    }

    isDescendant(parentId, childId) {
        const parent = this.nodes.find(n => n.id === parentId);
        if (!parent) return false;
        
        if (parent.children.includes(childId)) return true;
        
        for (const pid of parent.children) {
            if (this.isDescendant(pid, childId)) return true;
        }
        return false;
    }

    addNode(parentId, title, description) {
        const newNode = {
            id: Date.now().toString(),
            title,
            description,
            status: 'active',
            parentId,
            children: []
        };
        
        this.nodes.push(newNode);
        
        const parent = this.nodes.find(n => n.id === parentId);
        if (parent) {
            parent.children.push(newNode.id);
        }
        
        this.save();
        return newNode;
    }

    updateNodeStatus(id, status) {
        const node = this.nodes.find(n => n.id === id);
        if (node) {
            node.status = status;
            this.save();
        }
    }

    deleteNode(id) {
        if (id === 'root') return;
        
        const nodeIndex = this.nodes.findIndex(n => n.id === id);
        if (nodeIndex === -1) return;
        
        const node = this.nodes[nodeIndex];
        
        if (node.parentId) {
            const parent = this.nodes.find(n => n.id === node.parentId);
            if (parent) {
                parent.children = parent.children.filter(childId => childId !== id);
            }
        }
        
        const toRemove = [id];
        let i = 0;
        while(i < toRemove.length) {
            const currentId = toRemove[i];
            const children = this.nodes.filter(n => n.parentId === currentId).map(n => n.id);
            toRemove.push(...children);
            i++;
        }
        
        this.nodes = this.nodes.filter(n => !toRemove.includes(n.id));
        this.save();
    }

    // --- Sharing Features ---

    // Export current tree as a Base64 string
    exportTree() {
        try {
            const json = JSON.stringify(this.nodes);
            // Simple Base64 encoding (UTF-8 safe)
            return btoa(unescape(encodeURIComponent(json)));
        } catch (e) {
            console.error("Export failed:", e);
            return null;
        }
    }

    // Import a tree from a Base64 string
    // mode: 'replace' (overwrite current), 'preview' (just return data)
    importTree(base64Str, mode = 'preview') {
        try {
            const json = decodeURIComponent(escape(atob(base64Str)));
            const nodes = JSON.parse(json);
            
            // Basic validation
            if (!Array.isArray(nodes) || !nodes.find(n => n.id === 'root')) {
                throw new Error("Invalid format: Root node missing");
            }

            if (mode === 'replace') {
                this.nodes = nodes;
                this.save();
                return true;
            }
            
            return nodes; // Return for preview
        } catch (e) {
            console.error("Import failed:", e);
            throw new Error("Invalid Share Code");
        }
    }
}
