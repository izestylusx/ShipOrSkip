// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ShipOrSkipScoreboard
/// @notice BNB ecosystem intelligence — public, composable survival scores on-chain.
///         Stores project survival analyses, builder idea validations, and ecosystem
///         snapshots. All data is publicly readable; any protocol can query scores.
/// @dev Deployed on BSC mainnet (chainId 56). Owner = data curator (batch writes).
///      Builders can permissionlessly submit idea validations via submitIdea().
contract ShipOrSkipScoreboard {
    // ─── Structs ────────────────────────────────────────────────

    struct ProjectScore {
        string slug;
        uint8 score;          // 0-100 survival score
        uint8 status;         // 0=alive, 1=zombie, 2=dead, 3=pivoted
        uint256 registeredAt; // block.timestamp
    }

    struct IdeaRecord {
        address builder;
        string category;
        uint8 pmfScore;       // 0-100 PMF score from validator
        uint256 validatedAt;
    }

    struct EcosystemSnapshot {
        uint256 totalProjects;
        uint256 aliveCount;
        uint256 zombieCount;
        uint256 deadCount;
        uint256 snapshotAt;
    }

    // ─── State ──────────────────────────────────────────────────

    address public owner;

    mapping(bytes32 => ProjectScore) public projects;
    bytes32[] public projectIds;

    mapping(bytes32 => IdeaRecord) public ideas;
    bytes32[] public ideaIds;
    mapping(address => uint256) private _submissionNonces;

    EcosystemSnapshot public latestSnapshot;

    // ─── Events ─────────────────────────────────────────────────

    event ProjectRegistered(
        bytes32 indexed id, string slug, uint8 score, uint8 status
    );
    event IdeaValidated(
        bytes32 indexed id, address indexed builder, uint8 pmfScore, string category
    );
    event SnapshotUpdated(
        uint256 total, uint256 alive, uint256 zombie, uint256 dead
    );
    event OwnershipTransferred(
        address indexed previousOwner, address indexed newOwner
    );

    // ─── Modifiers ──────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ─── Constructor ────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ─── Owner: Batch Register Projects ─────────────────────────

    /// @notice Register or update multiple project survival scores in one tx.
    /// @param slugs  Project identifiers (e.g. "pancakeswap", "venus")
    /// @param scores Survival scores 0-100
    /// @param statuses 0=alive, 1=zombie, 2=dead, 3=pivoted
    function batchRegister(
        string[] calldata slugs,
        uint8[] calldata scores,
        uint8[] calldata statuses
    ) external onlyOwner {
        uint256 len = slugs.length;
        require(len == scores.length && len == statuses.length, "Length mismatch");
        require(len > 0 && len <= 100, "Invalid batch size");

        for (uint256 i = 0; i < len; ) {
            require(scores[i] <= 100, "Score out of range");
            require(statuses[i] <= 3, "Invalid status");

            bytes32 id = keccak256(abi.encodePacked(slugs[i]));
            bool isNew = projects[id].registeredAt == 0;

            projects[id] = ProjectScore({
                slug: slugs[i],
                score: scores[i],
                status: statuses[i],
                registeredAt: block.timestamp
            });

            if (isNew) {
                projectIds.push(id);
            }

            emit ProjectRegistered(id, slugs[i], scores[i], statuses[i]);
            unchecked { ++i; }
        }
    }

    // ─── Public: Submit Idea Validation ─────────────────────────

    /// @notice Any builder can record their idea validation on-chain.
    ///         ideaId is computed deterministically: keccak256(sender, nonce, category, pmfScore).
    ///         This prevents mempool front-running — no caller-supplied ideaId accepted.
    /// @param category Category string (e.g. "DEX", "Lending", "Gaming") — max 64 bytes
    /// @param pmfScore PMF score 0-100 from the validator
    /// @return ideaId The computed on-chain identifier for this record
    function submitIdea(
        string calldata category,
        uint8 pmfScore
    ) external returns (bytes32 ideaId) {
        require(bytes(category).length > 0, "Empty category");
        require(bytes(category).length <= 64, "Category too long");
        require(pmfScore <= 100, "Score out of range");

        ideaId = keccak256(abi.encodePacked(msg.sender, _submissionNonces[msg.sender]++, category, pmfScore));

        ideas[ideaId] = IdeaRecord({
            builder: msg.sender,
            category: category,
            pmfScore: pmfScore,
            validatedAt: block.timestamp
        });
        ideaIds.push(ideaId);
        emit IdeaValidated(ideaId, msg.sender, pmfScore, category);
    }

    // ─── Owner: Ecosystem Snapshot ──────────────────────────────

    /// @notice Record aggregate ecosystem health stats.
    function updateSnapshot(
        uint256 total,
        uint256 alive,
        uint256 zombie,
        uint256 dead
    ) external onlyOwner {
        latestSnapshot = EcosystemSnapshot(
            total, alive, zombie, dead, block.timestamp
        );
        emit SnapshotUpdated(total, alive, zombie, dead);
    }

    // ─── Owner: Transfer Ownership ──────────────────────────────

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        address prev = owner;
        owner = newOwner;
        emit OwnershipTransferred(prev, newOwner);
    }

    /// @notice Irreversibly renounce ownership (emergency use only).
    function renounceOwnership() external onlyOwner {
        address prev = owner;
        owner = address(0);
        emit OwnershipTransferred(prev, address(0));
    }

    // ─── View Helpers ───────────────────────────────────────────

    function getProjectCount() external view returns (uint256) {
        return projectIds.length;
    }

    function getIdeaCount() external view returns (uint256) {
        return ideaIds.length;
    }

    /// @notice Look up a project by its slug string.
    function getProjectBySlug(
        string calldata slug
    ) external view returns (ProjectScore memory) {
        return projects[keccak256(abi.encodePacked(slug))];
    }

    /// @notice Look up a project by its bytes32 id.
    function getProjectById(
        bytes32 id
    ) external view returns (ProjectScore memory) {
        return projects[id];
    }

    /// @notice Look up an idea record by its id.
    function getIdeaById(
        bytes32 id
    ) external view returns (IdeaRecord memory) {
        return ideas[id];
    }
}
